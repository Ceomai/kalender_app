import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
};

/** Web `InputOTP`: joined slots, one hidden input receives the digits (and SMS/e-mail autofill). */
export function OtpInput({ value, onChange, length = 6, autoFocus }: Props) {
  const { colors } = useTheme();
  const ref = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={styles.group} accessibilityLabel="OTP">
      {Array.from({ length }, (_, i) => {
        const isActive = focused && i === active;
        return (
          <View
            key={i}
            style={[
              styles.slot,
              { borderColor: colors.input },
              i === 0 && styles.first,
              i === length - 1 && styles.last,
              isActive && { borderColor: colors.ring, borderWidth: 2, zIndex: 1 },
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        maxLength={length}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', alignSelf: 'center' },
  slot: {
    width: 44,
    height: 48,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: SHADOWS.sm,
  },
  first: { borderLeftWidth: 1, borderTopLeftRadius: RADII.md, borderBottomLeftRadius: RADII.md },
  last: { borderTopRightRadius: RADII.md, borderBottomRightRadius: RADII.md },
  digit: { fontFamily: FONTS.bodySemi, fontSize: 18 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
