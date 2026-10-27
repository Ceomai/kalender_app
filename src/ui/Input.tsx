import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';

export type InputProps = TextInputProps & { multiline?: boolean };

/** shadcn `Input` / `Textarea`: `h-9 rounded-md border border-input px-3 shadow-sm`, ring on focus. */
export const Input = forwardRef<TextInputInstance, InputProps>(function Input(
  { style, multiline, editable = true, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      multiline={multiline}
      editable={editable}
      placeholderTextColor={colors.mutedForeground}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.base,
        multiline ? styles.multiline : styles.single,
        {
          color: colors.foreground,
          borderColor: focused ? colors.ring : colors.input,
          opacity: editable ? 1 : 0.5,
        },
        style,
      ]}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<TextInputInstance, TextInputProps>(function Textarea(props, ref) {
  return <Input ref={ref} multiline textAlignVertical="top" {...props} />;
});

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    fontFamily: FONTS.body,
    fontSize: 16,
    backgroundColor: 'transparent',
    boxShadow: SHADOWS.sm,
  },
  single: { height: 36, paddingVertical: 4 },
  multiline: { minHeight: 60, paddingVertical: 8 },
});
