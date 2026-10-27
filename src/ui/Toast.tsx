import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADII, SHADOWS, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type ToastItem = { id: number; kind: 'success' | 'error' | 'info'; message: string; description?: string };

let nextId = 1;
let listener: ((item: ToastItem) => void) | null = null;

function push(kind: ToastItem['kind'], message: string, description?: string) {
  listener?.({ id: nextId++, kind, message, description });
}

/** Same calls as `sonner` on the web: `toast.success("…")`, `toast.error("…")`, `toast("…")`. */
export const toast = Object.assign((message: string, opts?: { description?: string }) => push('info', message, opts?.description), {
  success: (message: string, opts?: { description?: string }) => push('success', message, opts?.description),
  error: (message: string, opts?: { description?: string }) => push('error', message, opts?.description),
});

/** Renders the toasts at the top of the screen; mount once near the root. */
export function Toaster() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listener = (item) => {
      setItems((prev) => [...prev.slice(-2), item]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), 3200);
    };
    return () => {
      listener = null;
    };
  }, []);

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      {items.map((item) => {
        const Icon = item.kind === 'error' ? CircleAlert : CircleCheck;
        const tint = item.kind === 'error' ? colors.destructiveText : item.kind === 'success' ? '#10b981' : colors.primary;
        return (
          <Animated.View
            key={item.id}
            entering={FadeInUp.duration(200)}
            exiting={FadeOutUp.duration(200)}
            style={[styles.toast, { backgroundColor: colors.popover, borderColor: colors.border }]}
          >
            <Icon size={18} color={tint} />
            <View style={{ flex: 1 }}>
              <Text variant="medium" color={colors.popoverForeground}>
                {item.message}
              </Text>
              {item.description && <Text variant="small">{item.description}</Text>}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8, zIndex: 1000 },
  toast: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: RADII.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    boxShadow: SHADOWS.lg,
  },
});
