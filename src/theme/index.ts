import { useMemo } from 'react';

import { usePreferences } from '@/src/lib/PreferencesContext';
import { FONTS, RADIUS } from '@/src/theme/palettes';
import type { ColorTokens } from '@/src/theme/types';

export { FONTS, RADIUS };

/** Tailwind `rounded-*` steps used by the web, relative to `--radius`. */
export const RADII = {
  sm: RADIUS - 4,
  md: RADIUS - 2,
  lg: RADIUS,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

/** Tailwind shadow presets as RN `boxShadow` strings. */
export const SHADOWS = {
  sm: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  base: '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const;

/** `#rrggbb` + opacity → `#rrggbbaa` (Tailwind's `bg-card/60` etc.). */
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

export type ThemeColors = ColorTokens & {
  /**
   * Red for text and icons. The dark palettes' `destructive` is a background shade
   * (≈ #7f1d1d) that is unreadable as text on a dark background, so text uses red-400 there.
   */
  destructiveText: string;
};

export type Theme = {
  colors: ThemeColors;
  dark: boolean;
};

export function useTheme(): Theme {
  const { colors, prefs } = usePreferences();
  const dark = prefs.dark_mode;
  const themed = useMemo(() => ({ ...colors, destructiveText: dark ? '#f87171' : colors.destructive }), [colors, dark]);
  return { colors: themed, dark };
}
