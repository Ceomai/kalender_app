import { createElement } from 'react';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import type { DateFieldProps } from '@/src/ui/DateField';

export type { DateFieldProps };

/** Web build: the browser's own date/time input, styled like the shadcn Input. */
export function DateField({ mode, value, onChange }: DateFieldProps) {
  const { colors, dark } = useTheme();
  return createElement('input', {
    type: mode,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    style: {
      height: 36,
      width: '100%',
      boxSizing: 'border-box',
      border: `1px solid ${colors.input}`,
      borderRadius: RADII.md,
      padding: '0 12px',
      fontFamily: FONTS.body,
      fontSize: 14,
      color: colors.foreground,
      background: 'transparent',
      boxShadow: SHADOWS.sm,
      colorScheme: dark ? 'dark' : 'light',
    },
  });
}
