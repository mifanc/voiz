import type { TranscribeSegment } from 'whisper.rn';
import { getWhisperContext, isModelDownloaded } from './whisperManager';
import type { WordSegment } from './audioFeatures';

export interface TranscriptionResult {
  text: string;
  segments: WordSegment[];
}

export async function transcribe(filePath: string): Promise<TranscriptionResult> {
  if (!(await isModelDownloaded())) {
    return { text: '', segments: [] };
  }

  const ctx = await getWhisperContext();
  // Native modules expect a Unix path, not a file:// URI
  const audioPath = filePath.replace(/^file:\/\//, '');

  const { promise } = ctx.transcribe(audioPath, {
    language: 'en',
    maxLen: 1,
    tokenTimestamps: true,
  });

  const { result, segments } = await promise;

  const wordSegments: WordSegment[] = (segments ?? []).map((s: TranscribeSegment) => ({
    word: s.text.trim(),
    start: s.t0 / 100,  // centiseconds → seconds
    end: s.t1 / 100,
  }));

  return { text: result, segments: wordSegments };
}

export async function isWhisperReady(): Promise<boolean> {
  return isModelDownloaded();
}
