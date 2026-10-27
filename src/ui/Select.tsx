import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FONTS, RADII, SHADOWS, useTheme } from '@/src/theme';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T | undefined;
  options: Option<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
};

/** shadcn `Select`: the same trigger, with the options listed in a bottom sheet. */
export function Select<T extends string>({ value, options, onChange, placeholder, title, disabled }: Props<T>) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: colors.input, opacity: disabled ? 0.5 : 1 }]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, { color: current ? colors.foreground : colors.mutedForeground }]}
        >
          {current?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDown size={16} color={colors.foreground} style={{ opacity: 0.5 }} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title={title ?? placeholder}>
        <View style={styles.list}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.item,
                  (pressed || selected) && { backgroundColor: colors.accent },
                ]}
              >
                <Text style={{ color: selected ? colors.accentForeground : colors.foreground, flex: 1 }}>
                  {opt.label}
                </Text>
                {selected && <Check size={16} color={colors.accentForeground} />}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    boxShadow: SHADOWS.sm,
  },
  value: { flex: 1, fontFamily: FONTS.body, fontSize: 14 },
  list: { gap: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: RADII.sm,
  },
});
