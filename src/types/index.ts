export type AiMode = 'local' | 'cloud';

export interface Recording {
  id: number;
  title: string;
  file_path: string;
  duration_ms: number;
  created_at: string;
  processed_at: string | null;
}

export interface Note {
  id: number;
  recording_id: number;
  summary: string;
  raw_transcript: string;
  created_at: string;
}

export interface ActionItem {
  id: number;
  recording_id: number;
  text: string;
  urgency: number;
  completed: boolean;
  created_at: string;
}

export interface Todo {
  id: number;
  recording_id: number;
  text: string;
  urgency: number;
  completed: boolean;
  created_at: string;
}

export interface NoteDetail {
  note: Note;
  actionItems: ActionItem[];
  todos: Todo[];
}

export interface AudioFeatures {
  wpm: number;
  pauseRatio: number;
  ampVariance: number;
}
