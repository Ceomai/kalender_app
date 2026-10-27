import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

/** shadcn `Badge`: `rounded-md border px-2.5 py-0.5 text-xs font-semibold`. */
export function Badge({
  variant = 'default',
  style,
  children,
}: {
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const v = {
    default: { bg: colors.primary, fg: colors.primaryForeground, border: 'transparent', shadow: SHADOWS.base },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground, border: 'transparent', shadow: undefined },
    destructive: { bg: colors.destructive, fg: colors.destructiveForeground, border: 'transparent', shadow: SHADOWS.base },
    outline: { bg: 'transparent', fg: colors.foreground, border: colors.border, shadow: undefined },
  }[variant];
  return (
    <View style={[styles.base, { backgroundColor: v.bg, borderColor: v.border, boxShadow: v.shadow }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, { color: v.fg }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  text: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 16 },
});
