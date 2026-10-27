import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { RADII, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** Web empty box: `rounded-3xl border border-dashed bg-card/60 py-14 text-center`. */
export function EmptyState({
  title,
  description,
  children,
  style,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: alpha(colors.card, 0.6) }, style]}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="muted" style={styles.desc}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
}

/** Centered spinner card shown while a list loads. */
export function LoadingCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
      <View style={[styles.spinner, { borderColor: colors.primary, borderTopColor: 'transparent' }]} />
    </View>
  );
}

/** Web `load.error` box. */
export function ErrorCard({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.error, { borderColor: alpha(colors.destructive, 0.4), backgroundColor: alpha(colors.destructive, 0.05) }]}
    >
      <Text style={{ color: colors.destructiveText }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADII['3xl'],
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: 'center',
  },
  title: { textAlign: 'center' },
  desc: { marginTop: 4, textAlign: 'center' },
  loading: { borderWidth: 1, borderRadius: RADII['3xl'], paddingVertical: 96, alignItems: 'center' },
  spinner: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  error: { borderWidth: 1, borderRadius: RADII['3xl'], paddingHorizontal: 20, paddingVertical: 24 },
});
