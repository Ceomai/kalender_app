import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/src/theme';

/** Web `<main className="mx-auto max-w-6xl px-4 pt-6">` + the page's `animate-fade space-y-5`. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.stack}>
        {children}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1152, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  stack: { gap: 20 },
});
