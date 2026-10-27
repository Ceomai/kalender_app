import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ChipColors } from '@/src/constants/categories';
import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type PillProps = {
  label: string;
  selected?: boolean;
  /** Category / priority colours when selected; the primary colour otherwise. */
  colors?: ChipColors;
  icon?: LucideIcon;
  /** Small coloured dot before the label (priority). */
  dot?: string;
  disabled?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** The web's rounded-full chip buttons (`rounded-full border px-3 py-1.5 text-xs`). */
export function Pill({ label, selected, colors, icon: Icon, dot, disabled, onPress, leading, style }: PillProps) {
  const theme = useTheme().colors;
  const palette = selected
    ? colors
      ? { bg: colors.bg, fg: colors.fg, border: colors.border }
      : { bg: theme.primary, fg: theme.primaryForeground, border: theme.primary }
    : { bg: 'transparent', fg: theme.mutedForeground, border: alpha(theme.border, 0.6) };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: pressed && !selected ? theme.accent : palette.bg, borderColor: palette.border },
        disabled && { opacity: 0.6 },
        style,
      ]}
    >
      {leading}
      {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
      {Icon && <Icon size={14} color={palette.fg} />}
      <Text style={[styles.label, { color: palette.fg, fontFamily: selected && !colors ? FONTS.bodySemi : FONTS.bodyMedium }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Horizontally scrolling row of pills (`overflow-x-auto no-scrollbar`). */
export function PillRow({ children, wrap, style }: { children: ReactNode; wrap?: boolean; style?: StyleProp<ViewStyle> }) {
  if (wrap) return <View style={[styles.wrap, style]}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {children}
    </ScrollView>
  );
}

type SegmentProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Pill-shaped segmented control (`rounded-full border bg-card/70 p-1`, active `bg-primary`). */
export function Segmented<T extends string>({ value, options, onChange, style }: SegmentProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segment, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.card, 0.7) }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, active && { backgroundColor: colors.primary, boxShadow: SHADOWS.sm }]}
          >
            <Text style={[styles.segLabel, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADII.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segment: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: RADII.full, padding: 4 },
  segItem: { borderRadius: RADII.full, paddingHorizontal: 12, paddingVertical: 4 },
  segLabel: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 16 },
});
