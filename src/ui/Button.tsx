import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { FONTS, RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** shadcn `Button` (same variants and sizes as `src/components/ui/button.jsx` on the web). */
export function Button({
  variant = 'default',
  size = 'default',
  icon: Icon,
  loading,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const palette = {
    default: { bg: colors.primary, pressed: alpha(colors.primary, 0.9), fg: colors.primaryForeground, shadow: SHADOWS.base },
    destructive: {
      bg: colors.destructive,
      pressed: alpha(colors.destructive, 0.9),
      fg: colors.destructiveForeground,
      shadow: SHADOWS.sm,
    },
    outline: { bg: 'transparent', pressed: colors.accent, fg: colors.foreground, shadow: SHADOWS.sm },
    secondary: { bg: colors.secondary, pressed: alpha(colors.secondary, 0.8), fg: colors.secondaryForeground, shadow: SHADOWS.sm },
    ghost: { bg: 'transparent', pressed: colors.accent, fg: colors.foreground, shadow: undefined },
    link: { bg: 'transparent', pressed: 'transparent', fg: colors.primary, shadow: undefined },
  }[variant];

  const dims = {
    default: { height: 36, paddingHorizontal: 16 },
    sm: { height: 32, paddingHorizontal: 12 },
    lg: { height: 40, paddingHorizontal: 32 },
    icon: { height: 36, width: 36 },
  }[size];

  const fontSize = size === 'sm' ? 12 : 14;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        dims,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          boxShadow: palette.shadow,
          opacity: inactive ? 0.5 : 1,
        },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.input },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        Icon && <Icon size={16} color={palette.fg} />
      )}
      {typeof children === 'string' ? (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONTS.bodyMedium,
            fontSize,
            color: palette.fg,
            textDecorationLine: variant === 'link' ? 'underline' : 'none',
          }}
        >
          {children}
        </Text>
      ) : children ? (
        <View style={styles.row}>{children}</View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
