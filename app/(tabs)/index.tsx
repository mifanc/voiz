import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NoteCard } from '../../src/components/NoteCard';
import { RecordButton } from '../../src/components/RecordButton';
import { Waveform } from '../../src/components/Waveform';
import {
  deleteAudioFile,
  requestPermissions,
  startRecording,
  stopRecording,
} from '../../src/services/audio';
import {
  deleteRecording,
  finaliseRecording,
  getAllRecordings,
  insertActionItem,
  insertNote,
  insertRecording,
  insertTodo,
} from '../../src/services/database';
import { extractAudioFeatures } from '../../src/services/audioFeatures';
import { transcribe } from '../../src/services/transcription';
import { generateNote } from '../../src/services/noteGenerator';
import { useRecordingStore } from '../../src/stores/useRecordingStore';
import type { Recording } from '../../src/types';

async function runAiPipeline(
  recordingId: number,
  uri: string,
  durationMs: number,
  meteringData: number[],
  aiMode: 'local' | 'cloud',
  apiKey: string,
  onDone: (title: string) => void,
): Promise<void> {
  try {
    const { text, segments } = await transcribe(uri);
    const features = extractAudioFeatures(segments, durationMs, meteringData);
    const note = await generateNote(text, features, aiMode, apiKey);
    await insertNote(recordingId, note.summary, text);
    for (const item of note.actionItems) {
      await insertActionItem(recordingId, item.text, item.urgency);
    }
    for (const todo of note.todos) {
      await insertTodo(recordingId, todo.text, todo.urgency);
    }
    await finaliseRecording(recordingId, note.title || 'New Recording');
    onDone(note.title || 'New Recording');
  } catch {
    // Pipeline errors are non-fatal; recording is already saved
  }
}

export default function LibraryScreen() {
  const router = useRouter();
  const { recordings, setRecordings, addRecording, removeRecording, updateRecording, aiMode, apiKey } =
    useRecordingStore();
  const [showRecorder, setShowRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAllRecordings().then(setRecordings);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    setElapsedMs(0);
    timerRef.current = setInterval(() => setElapsedMs((ms) => ms + 100), 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      stopTimer();
      try {
        const result = await stopRecording();
        const id = await insertRecording(result.uri, result.durationMs);
        const rec: Recording = {
          id,
          title: 'New Recording',
          file_path: result.uri,
          duration_ms: result.durationMs,
          created_at: new Date().toISOString(),
          processed_at: null,
        };
        addRecording(rec);
        setShowRecorder(false);
        setLevels([]);

        runAiPipeline(id, result.uri, result.durationMs, result.meteringData, aiMode, apiKey, (title) => {
          updateRecording(id, { title, processed_at: new Date().toISOString() });
        });
      } catch {
        Alert.alert('Error', 'Could not save recording. Please try again.');
      }
    } else {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Microphone access required', 'Enable microphone permission in Settings.');
        return;
      }
      try {
        await startRecording((db) => setLevels((prev) => [...prev.slice(-79), db]));
        setIsRecording(true);
        startTimer();
      } catch {
        Alert.alert('Error', 'Could not start recording.');
      }
    }
  };

  const handleDelete = (rec: Recording) => {
    Alert.alert('Delete recording?', rec.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecording(rec.id);
          await deleteAudioFile(rec.file_path);
          removeRecording(rec.id);
        },
      },
    ]);
  };

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const openRecorder = useCallback(() => setShowRecorder(true), []);

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={recordings}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mic-outline" size={52} color="#dde1e7" />
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptyHint}>Tap + to record a conversation</Text>
          </View>
        }
        renderItem={({ item }) => (
          <NoteCard
            recording={item}
            onPress={() => router.push(`/note/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          />
        )}
      />

      <Pressable style={styles.fab} onPress={openRecorder}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <Modal
        visible={showRecorder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { if (!isRecording) setShowRecorder(false); }}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isRecording ? 'Recording…' : 'New recording'}
            </Text>
            {!isRecording && (
              <Pressable onPress={() => setShowRecorder(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            )}
          </View>

          <View style={styles.waveformWrap}>
            <Waveform levels={levels} />
          </View>

          {isRecording && (
            <Text style={styles.timer}>{formatElapsed(elapsedMs)}</Text>
          )}

          <RecordButton isRecording={isRecording} onPress={handleRecordToggle} />

          <Text style={styles.hint}>
            {isRecording ? 'Tap to stop & analyse' : 'Tap to start'}
          </Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  list: { paddingVertical: 10, flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#94a3b8' },
  emptyHint: { fontSize: 14, color: '#cbd5e1' },
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  modal: { flex: 1, backgroundColor: '#f8fafc', padding: 24 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  waveformWrap: { flex: 1, justifyContent: 'center' },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 12,
  },
});
