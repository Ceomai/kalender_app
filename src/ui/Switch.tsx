import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SHADOWS, useTheme } from '@/src/theme';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** shadcn `Switch`: 36×20 track, 16px thumb, `bg-primary` when on, `bg-input` when off. */
export function Switch({ value, onValueChange, disabled, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 150 });
  }, [value, progress]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 16 }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? colors.primary : colors.input, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Animated.View style={[styles.thumb, { backgroundColor: colors.background }, thumb]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    boxShadow: SHADOWS.sm,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    boxShadow: SHADOWS.lg,
  },
});
