import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { UrgencyBadge } from './UrgencyBadge';
import type { ActionItem, Todo } from '../types';

interface Props {
  item: ActionItem | Todo;
  onToggle: (id: number, completed: boolean) => void;
}

export function ActionItemRow({ item, onToggle }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={() => {
        Haptics.selectionAsync();
        onToggle(item.id, !item.completed);
      }}
    >
      <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.text, item.completed && styles.textDone]} numberOfLines={3}>
        {item.text}
      </Text>
      {!item.completed && <UrgencyBadge urgency={item.urgency} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
});
