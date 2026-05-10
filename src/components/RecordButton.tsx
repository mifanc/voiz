import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  isRecording: boolean;
  onPress: () => void;
}

export function RecordButton({ isRecording, onPress }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const radius = useSharedValue(40);
  const size = useSharedValue(80);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      opacity.value = withRepeat(
        withTiming(0.65, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      radius.value = withTiming(14, { duration: 200 });
      size.value = withTiming(64, { duration: 200 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      radius.value = withTiming(40, { duration: 200 });
      size.value = withTiming(80, { duration: 200 });
    }
  }, [isRecording]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: size.value,
    height: size.value,
    borderRadius: radius.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(
      isRecording ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy,
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.wrapper} hitSlop={16}>
      <Animated.View style={[styles.button, animStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#ef4444',
  },
});
