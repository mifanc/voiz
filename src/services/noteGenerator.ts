import type { AiMode, AudioFeatures } from '../types';

export interface GeneratedNote {
  summary: string;
  title: string;
  actionItems: Array<{ text: string; urgency: number }>;
  todos: Array<{ text: string; urgency: number }>;
}

export function buildPrompt(transcript: string, features: AudioFeatures): string {
  return `You are a meeting assistant. Given a transcript and audio analysis, output ONLY valid JSON with no markdown fences.

AUDIO ANALYSIS:
- Speech rate: ${features.wpm} words per minute (normal: 130–150 wpm)
- Pause ratio: ${features.pauseRatio}% silence (relaxed >20%, urgent <10%)
- Amplitude variance: ${features.ampVariance} (high = emotional intensity)

TRANSCRIPT:
${transcript}

Output this exact JSON shape:
{
  "title": "short descriptive title (max 6 words)",
  "summary": "2–3 sentence overview of the conversation",
  "action_items": [{ "text": "...", "urgency": 1 }],
  "todos": [{ "text": "...", "urgency": 1 }]
}

Urgency: 1=low, 2=minor, 3=normal, 4=high, 5=critical.
Combine audio signals and language cues to score urgency accurately.`;
}

// Phase 3: swap stub with llama.rn (local) call.
// Phase 5: add cloud branch using @anthropic-ai/sdk when aiMode === 'cloud'.
export async function generateNote(
  _transcript: string,
  _features: AudioFeatures,
  _mode: AiMode,
  _apiKey?: string,
): Promise<GeneratedNote> {
  return { title: 'New Recording', summary: '', actionItems: [], todos: [] };
}
