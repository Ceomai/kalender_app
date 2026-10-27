import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** Web `AuthLayout`: centered icon + title above a `rounded-2xl` card. */
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.column}>
          <View style={styles.head}>
            <View style={[styles.icon, { backgroundColor: colors.primary }]}>
              <Icon size={28} color={colors.primaryForeground} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text variant="muted" style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  column: { width: '100%', maxWidth: 448, alignSelf: 'center' },
  head: { alignItems: 'center', marginBottom: 32 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: RADII['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: FONTS.headingBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.75, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 24, boxShadow: SHADOWS.sm },
  footer: { marginTop: 24, alignItems: 'center' },
});
