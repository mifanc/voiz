# Voiz

Record a conversation. Get a summary, action items, and to-dos — automatically.

Voiz transcribes your audio on-device with Whisper, analyses the speech patterns, and feeds everything into a language model to produce structured notes. No audio ever leaves your phone unless you explicitly switch to Cloud mode.

---

## Getting started

### 1. Download the AI models

Before your first recording, go to **Settings → Models** and download the two models Voiz needs:

| Model | Size | Purpose |
|---|---|---|
| Whisper base.en | ~74 MB | Transcribes your speech to text |
| Phi-3 Mini Q4_K_M | ~2.2 GB | Generates summaries, action items, and to-dos |

Tap **Download** next to each one. A progress bar tracks the download. Both say **Ready** when done. You only need to do this once — models are stored on your device.

> Wi-Fi recommended for the Phi-3 download.

---

## Recording a conversation

1. Tap **+** on the Library screen.
2. Tap the **red button** to start recording. You'll feel a haptic confirmation and see the waveform animate.
3. Speak naturally. The timer shows elapsed time.
4. Tap the button again to stop. Another haptic confirms the stop.
5. The sheet closes and the new recording appears in the list marked **Processing…**

Voiz runs the full AI pipeline in the background — transcription → audio analysis → note generation. This takes anywhere from a few seconds (cloud) to a couple of minutes (on-device with Phi-3). The title updates automatically when processing finishes.

---

## Reading your notes

Tap any recording in the Library to open its note.

### Summary
A 2–3 sentence overview of what was discussed.

### Voice Analysis
Four metrics extracted from the raw audio — no transcription needed:

| Metric | What it means |
|---|---|
| **Pace** | Words per minute. Fast (>160 wpm) or slow (<110 wpm) pace is flagged. |
| **Pauses** | Percentage of the recording that was silence. Low pause ratio signals urgency. |
| **Energy peaks** | Fraction of samples above a loudness threshold — indicates emphasis or stress. |
| **Urgency signal** | A 0–10 score combining all three signals. Feeds directly into the LLM's urgency scoring. |

### Action Items
Things that need to be done. Each has an **urgency badge** (1–5). Tap an item to mark it complete — it gets a strikethrough and the badge disappears.

### To-Do
Lower-priority follow-ups, structured the same way as action items.

### Transcript
The raw Whisper transcription, shown in a monospace font.

---

## Urgency badges

The colour scale applies everywhere badges appear:

| Colour | Urgency | Meaning |
|---|---|---|
| Green | 1–2 | Low priority |
| Yellow | 3 | Normal |
| Orange | 4 | High |
| Red | 5 | Critical |

On the Library screen, a badge only appears on a card if the recording has at least one item with urgency ≥ 4, so your eye is drawn to what actually needs attention.

---

## Sharing a note

Tap the **share icon** (top-right of a note) to export a plain-text summary that includes the title, summary, action items with urgency scores, to-dos, and the full transcript. Works with any share target — Messages, Mail, Notes, etc.

---

## Deleting a recording

**Long-press** a card in the Library. A confirmation alert appears before anything is deleted. This removes the recording, its audio file, and all generated notes from the device.

---

## Cloud mode (Claude API)

Cloud mode sends your transcript to Anthropic's Claude Haiku model instead of running Phi-3 on-device. Notes are generated in seconds rather than minutes, and quality is generally higher — especially for complex or technical conversations.

### Setup

1. Go to **Settings → AI Mode** and toggle **Cloud Mode** on.
2. Enter your Anthropic API key (`sk-ant-…`) in the field that appears.
3. Tap **Verify** to confirm the key reaches Anthropic before you record.
4. Tap **Save key** — the key is stored in the iOS Secure Enclave and never transmitted anywhere except `api.anthropic.com`.

### What gets sent

Only the **transcript text** and the five audio metrics (numbers, not audio) are sent to the API. Your audio file stays on device.

### Switching back

Toggle Cloud Mode off at any time. On-device mode picks up immediately for the next recording (as long as the Phi-3 model is downloaded).

---

## Pull to refresh

Swipe down on the Library list to reload recordings and urgency badges — useful if you've processed a recording on another device or cleared data from Settings.

---

## Clearing all data

**Settings → Data → Clear all recordings & notes** removes everything from the database and the Library. Audio files are also deleted. Model files are kept — you won't need to re-download Whisper or Phi-3.
