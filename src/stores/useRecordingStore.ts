import { create } from 'zustand';
import type { AiMode, Recording } from '../types';

interface RecordingStore {
  recordings: Recording[];
  aiMode: AiMode;
  apiKey: string;
  setRecordings: (recordings: Recording[]) => void;
  addRecording: (recording: Recording) => void;
  removeRecording: (id: number) => void;
  updateRecording: (id: number, updates: Partial<Recording>) => void;
  setAiMode: (mode: AiMode) => void;
  setApiKey: (key: string) => void;
}

export const useRecordingStore = create<RecordingStore>((set) => ({
  recordings: [],
  aiMode: 'local',
  apiKey: '',
  setRecordings: (recordings) => set({ recordings }),
  addRecording: (recording) =>
    set((state) => ({ recordings: [recording, ...state.recordings] })),
  removeRecording: (id) =>
    set((state) => ({ recordings: state.recordings.filter((r) => r.id !== id) })),
  updateRecording: (id, updates) =>
    set((state) => ({
      recordings: state.recordings.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  setAiMode: (aiMode) => set({ aiMode }),
  setApiKey: (apiKey) => set({ apiKey }),
}));
