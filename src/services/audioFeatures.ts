import type { AudioFeatures } from '../types';

export interface WordSegment {
  word: string;
  start: number;
  end: number;
}

export function extractAudioFeatures(
  segments: WordSegment[],
  totalDurationMs: number,
  meteringData: number[],
): AudioFeatures {
  if (segments.length === 0 || totalDurationMs === 0) {
    return { wpm: 0, pauseRatio: 0, ampVariance: 0, peakRatio: 0, audioUrgency: 0 };
  }

  const durationMin = totalDurationMs / 60_000;
  const wpm = Math.round(segments.length / durationMin);

  // Gaps > 300ms between word segments count as pauses
  let silenceMs = 0;
  for (let i = 1; i < segments.length; i++) {
    const gap = (segments[i].start - segments[i - 1].end) * 1000;
    if (gap > 300) silenceMs += gap;
  }
  const pauseRatio = Math.round((silenceMs / totalDurationMs) * 100);

  let ampVariance = 0;
  let peakRatio = 0;
  if (meteringData.length > 0) {
    const mean = meteringData.reduce((a, b) => a + b, 0) / meteringData.length;
    const variance =
      meteringData.reduce((sum, v) => sum + (v - mean) ** 2, 0) / meteringData.length;
    ampVariance = Math.round(Math.sqrt(variance));
    // Fraction of samples above -20 dBFS — emphatic or loud speech
    peakRatio = Math.round(
      (meteringData.filter((v) => v > -20).length / meteringData.length) * 100,
    );
  }

  // Combine signals into a 0.0–1.0 urgency score (purely from audio, before LLM)
  const wpmFactor = Math.min(wpm / 180, 1.0);             // 180+ wpm = max
  const pauseFactor = Math.max(0, 1 - pauseRatio / 40);   // 0% pause = max, 40%+ = 0
  const peakFactor = Math.min(peakRatio / 40, 1.0);       // 40%+ loud samples = max
  const audioUrgency =
    Math.round((wpmFactor * 0.4 + pauseFactor * 0.35 + peakFactor * 0.25) * 100) / 100;

  return { wpm, pauseRatio, ampVariance, peakRatio, audioUrgency };
}
