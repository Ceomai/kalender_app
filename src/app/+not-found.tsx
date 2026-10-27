import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="title">{t('nf.title')}</Text>
        <Link href="/" asChild>
          <Button variant="outline">{t('nf.home')}</Button>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
});
