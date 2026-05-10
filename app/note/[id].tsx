import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionItemRow } from '../../src/components/ActionItem';
import { getNoteDetail, toggleActionItem, toggleTodo } from '../../src/services/database';
import { useRecordingStore } from '../../src/stores/useRecordingStore';
import type { Note, NoteDetail } from '../../src/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MetricCell({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={[styles.metricBadge, { backgroundColor: badgeColor + '22' }]}>
        <Text style={[styles.metricBadgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
  );
}

function VoiceAnalysis({ note }: { note: Note }) {
  const paceBadge = note.wpm < 110 ? 'Slow' : note.wpm > 160 ? 'Fast' : 'Normal';
  const paceColor = note.wpm > 160 ? '#ef4444' : note.wpm < 110 ? '#64748b' : '#22c55e';

  const pauseBadge = note.pause_ratio < 10 ? 'Rushed' : note.pause_ratio > 25 ? 'Relaxed' : 'Normal';
  const pauseColor = note.pause_ratio < 10 ? '#ef4444' : note.pause_ratio > 25 ? '#22c55e' : '#6366f1';

  const peakBadge = note.peak_ratio > 40 ? 'High' : note.peak_ratio > 15 ? 'Moderate' : 'Low';
  const peakColor = note.peak_ratio > 40 ? '#f59e0b' : note.peak_ratio > 15 ? '#6366f1' : '#64748b';

  const urgencyScore = Math.round(note.audio_urgency * 10);
  const urgencyBadge = note.audio_urgency > 0.6 ? 'High' : note.audio_urgency > 0.35 ? 'Medium' : 'Low';
  const urgencyColor = note.audio_urgency > 0.6 ? '#ef4444' : note.audio_urgency > 0.35 ? '#f59e0b' : '#22c55e';

  return (
    <View style={styles.metricsGrid}>
      <MetricCell label="Pace" value={`${note.wpm} wpm`} badge={paceBadge} badgeColor={paceColor} />
      <MetricCell label="Pauses" value={`${note.pause_ratio}% silence`} badge={pauseBadge} badgeColor={pauseColor} />
      <MetricCell label="Energy peaks" value={`${note.peak_ratio}%`} badge={peakBadge} badgeColor={peakColor} />
      <MetricCell label="Urgency signal" value={`${urgencyScore}/10`} badge={urgencyBadge} badgeColor={urgencyColor} />
    </View>
  );
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordings = useRecordingStore((s) => s.recordings);
  const recording = recordings.find((r) => r.id === Number(id));
  const [detail, setDetail] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNoteDetail(Number(id))
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleAction = async (itemId: number, completed: boolean) => {
    await toggleActionItem(itemId, completed);
    setDetail((prev) =>
      prev
        ? { ...prev, actionItems: prev.actionItems.map((a) => (a.id === itemId ? { ...a, completed } : a)) }
        : null,
    );
  };

  const handleToggleTodo = async (itemId: number, completed: boolean) => {
    await toggleTodo(itemId, completed);
    setDetail((prev) =>
      prev
        ? { ...prev, todos: prev.todos.map((t) => (t.id === itemId ? { ...t, completed } : t)) }
        : null,
    );
  };

  const handleShare = async () => {
    if (!detail) return;
    const lines: string[] = [];
    if (recording) lines.push(`# ${recording.title}\n`);
    if (detail.note.summary) lines.push(`## Summary\n${detail.note.summary}\n`);
    if (detail.actionItems.length) {
      lines.push('## Action Items');
      detail.actionItems.forEach((a) => lines.push(`- [${a.completed ? 'x' : ' '}] ${a.text} (urgency ${a.urgency})`));
    }
    if (detail.todos.length) {
      lines.push('\n## To-Do');
      detail.todos.forEach((t) => lines.push(`- [${t.completed ? 'x' : ' '}] ${t.text}`));
    }
    if (detail.note.raw_transcript) lines.push(`\n## Transcript\n${detail.note.raw_transcript}`);
    await Share.share({ message: lines.join('\n') });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (!recording) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Recording not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recording.title}</Text>
          {detail && (
            <Pressable onPress={handleShare} hitSlop={12}>
              <Ionicons name="share-outline" size={22} color="#6366f1" />
            </Pressable>
          )}
        </View>

        <Text style={styles.meta}>
          {new Date(recording.created_at).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })}
          {'  ·  '}
          {formatDuration(recording.duration_ms)}
        </Text>

        {!recording.processed_at && (
          <View style={styles.processingBanner}>
            <ActivityIndicator color="#6366f1" size="small" />
            <Text style={styles.processingText}>Analysing recording…</Text>
          </View>
        )}

        {detail ? (
          <>
            {detail.note.summary ? (
              <Section title="Summary">
                <Text style={styles.summary}>{detail.note.summary}</Text>
              </Section>
            ) : null}

            {detail.note.wpm > 0 && (
              <Section title="Voice Analysis">
                <VoiceAnalysis note={detail.note} />
              </Section>
            )}

            {detail.actionItems.length > 0 && (
              <Section title="Action Items">
                {detail.actionItems.map((item) => (
                  <ActionItemRow key={item.id} item={item} onToggle={handleToggleAction} />
                ))}
              </Section>
            )}

            {detail.todos.length > 0 && (
              <Section title="To-Do">
                {detail.todos.map((todo) => (
                  <ActionItemRow key={todo.id} item={todo} onToggle={handleToggleTodo} />
                ))}
              </Section>
            )}

            {detail.note.raw_transcript ? (
              <Section title="Transcript">
                <Text style={styles.transcript}>{detail.note.raw_transcript}</Text>
              </Section>
            ) : null}
          </>
        ) : (
          recording.processed_at && (
            <View style={[styles.center, { paddingTop: 60 }]}>
              <Ionicons name="document-text-outline" size={44} color="#dde1e7" />
              <Text style={styles.emptyText}>No notes generated.</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 56, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: '#0f172a', lineHeight: 30 },
  meta: { fontSize: 13, color: '#94a3b8', marginTop: -8 },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 14,
  },
  processingText: { fontSize: 14, color: '#6366f1', fontWeight: '500' },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBody: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    gap: 2,
  },
  summary: { fontSize: 15, color: '#1e293b', lineHeight: 24 },
  transcript: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: { fontSize: 16, color: '#94a3b8' },
  emptyText: { fontSize: 15, color: '#94a3b8' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
