import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UrgencyBadge } from './UrgencyBadge';
import type { Recording } from '../types';

interface Props {
  recording: Recording;
  highestUrgency?: number;
  onPress: () => void;
  onLongPress: () => void;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function NoteCard({ recording, highestUrgency, onPress, onLongPress }: Props) {
  const showBadge = typeof highestUrgency === 'number' && highestUrgency >= 4;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {recording.title}
        </Text>
        {showBadge && <UrgencyBadge urgency={highestUrgency!} />}
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{formatDate(recording.created_at)}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText}>{formatDuration(recording.duration_ms)}</Text>
        {!recording.processed_at && (
          <>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.pending}>Processing…</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: { opacity: 0.82 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 13, color: '#64748b' },
  dot: { fontSize: 13, color: '#cbd5e1' },
  pending: { fontSize: 13, color: '#6366f1', fontStyle: 'italic' },
});
