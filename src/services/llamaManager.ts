import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';

const MODEL_URL =
  'https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf';
const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_FILE = `${MODEL_DIR}phi-3-mini-4k-q4.gguf`;

let _ctx: LlamaContext | null = null;

function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, '');
}

export async function isLlamaModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_FILE);
  return info.exists;
}

export async function downloadLlamaModel(onProgress: (pct: number) => void): Promise<void> {
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

export async function getLlamaContext(): Promise<LlamaContext> {
  if (_ctx) return _ctx;
  _ctx = await initLlama({ model: toNativePath(MODEL_FILE), n_ctx: 2048 });
  return _ctx;
}
