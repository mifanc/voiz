import type { AiMode, AudioFeatures } from '../types';
import { getLlamaContext, isLlamaModelDownloaded } from './llamaManager';

const CLOUD_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Stable instructions — sent with cache_control so Anthropic caches them server-side
const SYSTEM_PROMPT = `You are a meeting assistant. Given a transcript and audio analysis, output ONLY valid JSON with no markdown fences.

Output this exact JSON shape:
{
  "title": "short descriptive title (max 6 words)",
  "summary": "2–3 sentence overview of the conversation",
  "action_items": [{ "text": "...", "urgency": 1 }],
  "todos": [{ "text": "...", "urgency": 1 }]
}

Urgency: 1=low, 2=minor, 3=normal, 4=high, 5=critical.
Combine audio signals and language cues to score urgency accurately.`;

export interface GeneratedNote {
  summary: string;
  title: string;
  actionItems: Array<{ text: string; urgency: number }>;
  todos: Array<{ text: string; urgency: number }>;
}

// Full prompt for on-device LLM (single-turn, instructions + data combined)
export function buildPrompt(transcript: string, features: AudioFeatures): string {
  return `${SYSTEM_PROMPT}\n\n${buildUserMessage(transcript, features)}`;
}

// Dynamic part only — used as the user message in the cloud path
function buildUserMessage(transcript: string, features: AudioFeatures): string {
  return `AUDIO ANALYSIS:
- Speech rate: ${features.wpm} wpm (normal 130–150; fast >160 signals urgency)
- Pause ratio: ${features.pauseRatio}% silence (relaxed >20%, urgent <10%)
- Amplitude variance: ${features.ampVariance} dB (higher = more dynamic/emotional delivery)
- Vocal energy peaks: ${features.peakRatio}% of recording above loud threshold
- Audio urgency signal: ${features.audioUrgency.toFixed(2)} / 1.0 (0 = calm, 1 = high pressure)

TRANSCRIPT:
${transcript}`;
}

const EMPTY_NOTE: GeneratedNote = { title: 'New Recording', summary: '', actionItems: [], todos: [] };

function parseNote(raw: string): GeneratedNote {
  try {
    const json = raw.replace(/```(?:json)?/g, '').trim();
    const parsed = JSON.parse(json);
    return {
      title: String(parsed.title || 'New Recording').slice(0, 80),
      summary: String(parsed.summary || ''),
      actionItems: Array.isArray(parsed.action_items)
        ? parsed.action_items.map((i: { text?: string; urgency?: number }) => ({
            text: String(i.text ?? ''),
            urgency: Math.min(5, Math.max(1, Number(i.urgency) || 3)),
          }))
        : [],
      todos: Array.isArray(parsed.todos)
        ? parsed.todos.map((t: { text?: string; urgency?: number }) => ({
            text: String(t.text ?? ''),
            urgency: Math.min(5, Math.max(1, Number(t.urgency) || 3)),
          }))
        : [],
    };
  } catch {
    return EMPTY_NOTE;
  }
}

export async function generateNote(
  transcript: string,
  features: AudioFeatures,
  mode: AiMode,
  apiKey?: string,
): Promise<GeneratedNote> {
  if (!transcript.trim()) return EMPTY_NOTE;

  if (mode === 'local') {
    if (!(await isLlamaModelDownloaded())) return EMPTY_NOTE;

    const ctx = await getLlamaContext();
    const result = await ctx.completion({
      prompt: buildPrompt(transcript, features),
      n_predict: 512,
      temperature: 0.1,
      stop: ['</s>', '<|end|>', '\n\n\n'],
    });
    return parseNote(result.text);
  }

  if (!apiKey?.trim()) return EMPTY_NOTE;

  // Call the Anthropic REST API directly with fetch — avoids bundling the SDK's
  // Node.js-only credential-file readers which import node:fs.
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLOUD_MODEL,
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildUserMessage(transcript, features) }],
    }),
  });

  const data = await res.json();
  const block = data?.content?.[0];
  return block?.type === 'text' ? parseNote(block.text) : EMPTY_NOTE;
}
