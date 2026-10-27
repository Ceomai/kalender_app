import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { FONTS, useTheme } from '@/src/theme';

type Variant = 'body' | 'medium' | 'semibold' | 'heading' | 'title' | 'display' | 'eyebrow' | 'muted' | 'small';

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: string;
};

/** Typography presets matching the web's `font-body` / `font-heading` classes. */
export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const base = {
    body: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20 },
    medium: { fontFamily: FONTS.bodyMedium, fontSize: 14, lineHeight: 20 },
    semibold: { fontFamily: FONTS.bodySemi, fontSize: 14, lineHeight: 20 },
    heading: { fontFamily: FONTS.heading, fontSize: 16, lineHeight: 22 },
    title: { fontFamily: FONTS.heading, fontSize: 30, lineHeight: 36 },
    display: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36 },
    eyebrow: {
      fontFamily: FONTS.bodySemi,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 2,
      textTransform: 'uppercase' as const,
    },
    muted: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20 },
    small: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 16 },
  }[variant];
  const muted = variant === 'muted' || variant === 'eyebrow' || variant === 'small';
  return (
    <RNText
      style={[base, { color: color ?? (muted ? colors.mutedForeground : colors.foreground) }, style]}
      {...rest}
    />
  );
}
