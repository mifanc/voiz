import * as FileSystem from 'expo-file-system/legacy';
import { initWhisper, WhisperContext } from 'whisper.rn';

const MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';
const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_FILE = `${MODEL_DIR}ggml-base.en.bin`;

let _ctx: WhisperContext | null = null;

// Native modules expect a Unix path, not a file:// URI
function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_FILE);
  return info.exists;
}

export async function downloadModel(onProgress: (pct: number) => void): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  const dl = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_FILE,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const pct =
        totalBytesExpectedToWrite > 0
          ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
          : 0;
      onProgress(pct);
    },
  );
  await dl.downloadAsync();
}

export async function getWhisperContext(): Promise<WhisperContext> {
  if (_ctx) return _ctx;
  _ctx = await initWhisper({ filePath: toNativePath(MODEL_FILE) });
  return _ctx;
}
