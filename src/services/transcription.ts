import type { WordSegment } from './audioFeatures';

export interface TranscriptionResult {
  text: string;
  segments: WordSegment[];
}

// Phase 2: integrate whisper.rn + on-device Whisper model here.
// whisper.rn provides word-level timestamps which feed into urgency analysis.
export async function transcribe(_filePath: string): Promise<TranscriptionResult> {
  return { text: '', segments: [] };
}

export function isWhisperReady(): boolean {
  return false;
}
