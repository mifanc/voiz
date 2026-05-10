import * as SQLite from 'expo-sqlite';
import type { AudioFeatures, Recording, Note, ActionItem, Todo, NoteDetail } from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('voiz.db');
    await _db.execAsync(`
      CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT 'New Recording',
        file_path TEXT NOT NULL,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        processed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recording_id INTEGER NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        raw_transcript TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS action_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recording_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        urgency INTEGER NOT NULL DEFAULT 3,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recording_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        urgency INTEGER NOT NULL DEFAULT 3,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // Phase 4 migrations: audio feature columns on existing notes rows default to 0
    for (const sql of [
      'ALTER TABLE notes ADD COLUMN wpm INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE notes ADD COLUMN pause_ratio INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE notes ADD COLUMN amp_variance INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE notes ADD COLUMN peak_ratio INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE notes ADD COLUMN audio_urgency REAL NOT NULL DEFAULT 0',
    ]) {
      try { await _db.runAsync(sql); } catch {}
    }
  }
  return _db;
}

export async function insertRecording(filePath: string, durationMs: number): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO recordings (file_path, duration_ms) VALUES (?, ?)',
    filePath,
    durationMs,
  );
  return result.lastInsertRowId;
}

export async function finaliseRecording(
  id: number,
  title: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE recordings SET title = ?, processed_at = datetime('now') WHERE id = ?",
    title,
    id,
  );
}

export async function getAllRecordings(): Promise<Recording[]> {
  const db = await getDb();
  return db.getAllAsync<Recording>('SELECT * FROM recordings ORDER BY created_at DESC');
}

export async function getMaxUrgencies(): Promise<Record<number, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ recording_id: number; max_urgency: number }>(
    `SELECT recording_id, MAX(urgency) AS max_urgency FROM (
       SELECT recording_id, urgency FROM action_items
       UNION ALL
       SELECT recording_id, urgency FROM todos
     ) GROUP BY recording_id`,
  );
  const map: Record<number, number> = {};
  for (const row of rows) map[row.recording_id] = row.max_urgency;
  return map;
}

export async function deleteRecording(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM action_items WHERE recording_id = ?', id);
  await db.runAsync('DELETE FROM todos WHERE recording_id = ?', id);
  await db.runAsync('DELETE FROM notes WHERE recording_id = ?', id);
  await db.runAsync('DELETE FROM recordings WHERE id = ?', id);
}

export async function insertNote(
  recordingId: number,
  summary: string,
  transcript: string,
  features?: AudioFeatures,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO notes
       (recording_id, summary, raw_transcript, wpm, pause_ratio, amp_variance, peak_ratio, audio_urgency)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    recordingId,
    summary,
    transcript,
    features?.wpm ?? 0,
    features?.pauseRatio ?? 0,
    features?.ampVariance ?? 0,
    features?.peakRatio ?? 0,
    features?.audioUrgency ?? 0,
  );
}

export async function insertActionItem(
  recordingId: number,
  text: string,
  urgency: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO action_items (recording_id, text, urgency) VALUES (?, ?, ?)',
    recordingId,
    text,
    urgency,
  );
}

export async function insertTodo(
  recordingId: number,
  text: string,
  urgency: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO todos (recording_id, text, urgency) VALUES (?, ?, ?)',
    recordingId,
    text,
    urgency,
  );
}

export async function getNoteDetail(recordingId: number): Promise<NoteDetail | null> {
  const db = await getDb();
  const note = await db.getFirstAsync<Note>(
    'SELECT * FROM notes WHERE recording_id = ?',
    recordingId,
  );
  if (!note) return null;

  type RawActionItem = Omit<ActionItem, 'completed'> & { completed: number };
  type RawTodo = Omit<Todo, 'completed'> & { completed: number };

  const actionItems = await db.getAllAsync<RawActionItem>(
    'SELECT * FROM action_items WHERE recording_id = ? ORDER BY urgency DESC, created_at ASC',
    recordingId,
  );
  const todos = await db.getAllAsync<RawTodo>(
    'SELECT * FROM todos WHERE recording_id = ? ORDER BY urgency DESC, created_at ASC',
    recordingId,
  );

  return {
    note,
    actionItems: actionItems.map((a) => ({ ...a, completed: Boolean(a.completed) })),
    todos: todos.map((t) => ({ ...t, completed: Boolean(t.completed) })),
  };
}

export async function toggleActionItem(id: number, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE action_items SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
}

export async function toggleTodo(id: number, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE todos SET completed = ? WHERE id = ?', completed ? 1 : 0, id);
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    'DELETE FROM todos; DELETE FROM action_items; DELETE FROM notes; DELETE FROM recordings;',
  );
}
