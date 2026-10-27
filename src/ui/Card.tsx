import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** shadcn `Card`: `rounded-xl border bg-card shadow`. */
export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      {...rest}
    />
  );
}

type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Web `SectionCard`: `rounded-3xl border border-border/70 bg-card p-5 shadow-sm`. */
export function SectionCard({ title, description, action, style, children }: SectionCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: alpha(colors.border, 0.7) },
        style,
      ]}
    >
      {(title || action) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text variant="heading">{title}</Text>}
            {description && (
              <Text variant="muted" style={styles.description}>
                {description}
              </Text>
            )}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.xl,
    borderWidth: 1,
    boxShadow: SHADOWS.base,
  },
  section: {
    borderRadius: RADII['3xl'],
    borderWidth: 1,
    padding: 20,
    boxShadow: SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  headerText: { flex: 1 },
  description: { marginTop: 4 },
});
