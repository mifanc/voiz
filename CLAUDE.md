# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

`npm`/`node` are **not** on PATH. Use `bun` exclusively:

```bash
bun install          # install dependencies
bun start            # start Expo dev server (then press i/a for iOS/Android)
bun run ios          # iOS simulator directly
bun run android      # Android emulator directly
bun x tsc --noEmit   # TypeScript check (no test suite yet)
```

After every commit, push to GitHub: `git push`. Always use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`).

## Architecture

### AI Pipeline

The core flow runs after every recording stops, orchestrated by `runAiPipeline()` in `app/(tabs)/index.tsx`:

```
Audio file (.m4a)
  → transcribe()          src/services/transcription.ts   [STUB — Phase 2: whisper.rn]
  → extractAudioFeatures() src/services/audioFeatures.ts  [computes wpm, pauseRatio, ampVariance]
  → generateNote()        src/services/noteGenerator.ts   [STUB — Phase 3: llama.rn / Phase 5: Claude API]
  → insertNote/insertActionItem/insertTodo  src/services/database.ts
  → finaliseRecording()   sets processed_at + title in SQLite
```

**Urgency scoring (1–5)** is assigned per action item and todo by the LLM. Audio signals (faster speech → lower pauseRatio → higher urgency) are injected into the LLM prompt alongside the transcript. The prompt template lives in `buildPrompt()` in `noteGenerator.ts`.

### State & Storage

- **Zustand store** (`src/stores/useRecordingStore.ts`) holds the in-memory recordings list, `aiMode` ('local'|'cloud'), and `apiKey`. It is the single source of truth for the UI.
- **SQLite** (`voiz.db` via expo-sqlite) is the persistent store. Tables: `recordings`, `notes`, `action_items`, `todos`. SQLite stores `completed` as `INTEGER` (0/1) — always convert to boolean on read (`Boolean(row.completed)`).
- **Audio files** are `.m4a` files stored in `FileSystem.documentDirectory + 'recordings/'` (legacy API).

### Key API Constraints

- **expo-file-system**: import from `expo-file-system/legacy`, not `expo-file-system`. The v55 top-level module is a new API; the legacy module has `documentDirectory`, `moveAsync`, `makeDirectoryAsync`, `deleteAsync`.
- **react-native-reanimated**: v4.2.3 + **react-native-worklets** v0.7.4 (required peer dep). Babel plugin `react-native-reanimated/plugin` remains last in `babel.config.js` — in v4 it re-exports from `react-native-worklets/plugin` automatically.
- **react-native**: pinned to 0.83.6 (expo SDK 55 requirement; 0.85.x breaks reanimated v4 peer dep check).
- **expo-sqlite v55**: async-only API — `openDatabaseAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `execAsync`. No synchronous methods.
- **expo-av compatibility shims**: expo-av@16 uses ObjC headers/macros removed from expo-modules-core@55. Three stub `.h` files and macro additions in `node_modules/expo-modules-core/ios/` keep it buildable — these are in node_modules and not committed; re-apply if you wipe node_modules and the iOS build fails on `EXEventEmitter.h` or `EXFatal`.
- **EXPermissionsService shim**: SDK 55 dropped auto-registration of `EXPermissionsService`, breaking `Audio.requestPermissionsAsync()` at runtime ("Permissions module not found"). Fix: patch `node_modules/expo-modules-core/ios/Legacy/Services/Permissions/EXPermissionsService.h` to add `<EXInternalModule>` conformance, and patch `EXPermissionsService.m` to add `EX_REGISTER_MODULE()` + `+(NSArray<Protocol*>*)exportedInterfaces { return @[@protocol(EXPermissionsInterface)]; }`. Not committed; re-apply after wiping node_modules.

### Navigation

Expo Router with typed routes (`"typedRoutes": true`). Three routes:
- `app/(tabs)/index.tsx` — Library screen (recording list + recording modal)
- `app/(tabs)/settings.tsx` — AI mode toggle, API key, model status, clear data
- `app/note/[id].tsx` — Note detail (summary, action items, todos, transcript, share)

### What's Stubbed (Phases 2–5)

| File | Status | Next step |
|---|---|---|
| `src/services/transcription.ts` | Returns empty string/segments | Phase 2: install `whisper.rn`, load model, call `transcribe()` |
| `src/services/noteGenerator.ts` | Returns empty note | Phase 3: install `llama.rn`, load Phi-3 Mini GGUF, parse JSON response |
| Settings model rows | Static "Phase 2/3" labels | Phase 2/3: add download progress via `expo-file-system` |
| Cloud mode (`aiMode === 'cloud'`) | Toggle exists, no effect | Phase 5: branch in `generateNote()` using `@anthropic-ai/sdk` |

The API key entered in Settings is stored via `expo-secure-store` under the key `anthropic_api_key` and kept in Zustand (`apiKey` field) for the pipeline.

### Conventions

- All StyleSheet styles are co-located in the same file as the component (no CSS-in-JS, no external style files).
- Components accept `onPress`/`onLongPress` as props; they do not navigate internally.
- The `UrgencyBadge` color scale: green (1–2), yellow (3), orange (4), red (5). Only badges with urgency ≥ 4 show on `NoteCard` in the library list.
