import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  urgency: number;
}

const BG: Record<number, string> = {
  1: '#86efac',
  2: '#86efac',
  3: '#fde68a',
  4: '#fb923c',
  5: '#f87171',
};

const LABEL: Record<number, string> = {
  1: 'Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

const TEXT: Record<number, string> = {
  1: '#166534',
  2: '#166534',
  3: '#92400e',
  4: '#7c2d12',
  5: '#7f1d1d',
};

export function UrgencyBadge({ urgency }: Props) {
  const level = Math.min(5, Math.max(1, Math.round(urgency)));
  return (
    <View style={[styles.badge, { backgroundColor: BG[level] }]}>
      <Text style={[styles.text, { color: TEXT[level] }]}>{LABEL[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
