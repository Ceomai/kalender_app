import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** shadcn `TabsList` + `TabsTrigger` as a segmented control. */
export function Tabs<T extends string>({ value, options, onChange, style }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.list, { backgroundColor: colors.muted }, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={[
              styles.trigger,
              active && { backgroundColor: colors.background, boxShadow: SHADOWS.base },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: active ? colors.foreground : colors.mutedForeground }]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: RADII.lg,
    padding: 4,
  },
  trigger: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    paddingHorizontal: 12,
  },
  label: { fontFamily: FONTS.bodyMedium, fontSize: 14 },
});
