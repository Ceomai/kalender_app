import { X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADII, SHADOWS, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
};

/**
 * Mobile stand-in for the web `Dialog`: a bottom sheet with the same header
 * (title + muted description + close button) over a `bg-black/80` overlay.
 */
export function Sheet({ open, onClose, title, description, footer, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);

  // Mount as soon as it opens; unmount only after the closing animation finishes.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 220 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [open, mounted, progress]);

  const overlay = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * height }] }));

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent onRequestClose={onClose} animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: alpha('#000000', 0.8) }, overlay]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.anchor}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              maxHeight: height * 0.92,
              paddingBottom: Math.max(insets.bottom, 16),
            },
            panel,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />
          {(title || description) && (
            <View style={styles.header}>
              {title && (
                <Text variant="heading" style={styles.title}>
                  {title}
                </Text>
              )}
              {description && <Text variant="muted">{description}</Text>}
            </View>
          )}
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            style={styles.close}
          >
            <X size={16} color={colors.foreground} style={{ opacity: 0.7 }} />
          </Pressable>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anchor: { flex: 1, justifyContent: 'flex-end' },
  panel: {
    borderTopLeftRadius: RADII['3xl'],
    borderTopRightRadius: RADII['3xl'],
    borderTopWidth: 1,
    paddingTop: 8,
    boxShadow: SHADOWS.lg,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  header: { paddingHorizontal: 24, paddingRight: 48, gap: 6, marginBottom: 8 },
  title: { fontSize: 18, lineHeight: 22 },
  close: { position: 'absolute', top: 20, right: 20, padding: 2, borderRadius: RADII.sm },
  body: { paddingHorizontal: 24, paddingVertical: 8, gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 24, paddingTop: 12 },
});
