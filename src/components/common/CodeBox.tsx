import * as Clipboard from 'expo-clipboard';
import { Check, Copy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

/** Invite code in large mono type with a copy button. */
export function CodeBox({ code, label }: { code: string; label?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {label && <Text variant="eyebrow" style={{ letterSpacing: 0.5 }}>{label}</Text>}
        <Text style={styles.code} selectable>
          {code}
        </Text>
      </View>
      <Button
        variant="outline"
        size="sm"
        icon={copied ? Check : Copy}
        onPress={() =>
          Clipboard.setStringAsync(code)
            .then(() => setCopied(true))
            .catch(() => setCopied(false))
        }
      >
        {copied ? t('common.copied') : t('common.copy')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  code: { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 4 },
});
