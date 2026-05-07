import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  levels: number[];
}

const MAX_BARS = 40;
const MIN_DB = -60;
const MAX_HEIGHT = 56;
const MIN_HEIGHT = 4;

function normalize(db: number): number {
  return Math.max(0, Math.min(1, (db - MIN_DB) / (0 - MIN_DB)));
}

export function Waveform({ levels }: Props) {
  const bars = levels.slice(-MAX_BARS);
  const padded = new Array(MAX_BARS - bars.length).fill(MIN_DB).concat(bars);

  return (
    <View style={styles.container}>
      {padded.map((db, i) => {
        const n = normalize(db);
        const height = MIN_HEIGHT + n * (MAX_HEIGHT - MIN_HEIGHT);
        return (
          <View
            key={i}
            style={[
              styles.bar,
              { height, opacity: 0.35 + n * 0.65 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    gap: 3,
    paddingHorizontal: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
});
