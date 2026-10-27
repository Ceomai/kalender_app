import { FileText, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useT } from '@/src/i18n';
import { pickICSFile } from '@/src/lib/ics-export';
import { importICS } from '@/src/services/ics';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

/** Pick an .ics file on the device and import its entries into my calendar. */
export function ICSImport() {
  const { colors } = useTheme();
  const t = useT();
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const run = useServiceMutation((text: string) => importICS(text), [queryKeys.events, queryKeys.upcoming]);

  const choose = async () => {
    const file = await pickICSFile().catch(() => null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.ics')) {
      toast.error(t('ics.onlyIcs'));
      return;
    }
    setFileName(file.name);
    setResult(null);
    run.mutate(file.text, {
      onSuccess: (res) => {
        setResult(res);
        toast.success(t('ics.toast').replace('{n}', String(res.created)));
      },
      onError: () => toast.error(t('ics.toastErr')),
      onSettled: () => setFileName(''),
    });
  };

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Button variant="outline" icon={Upload} loading={run.isPending} onPress={choose}>
          {run.isPending ? t('ics.importing') : t('ics.choose')}
        </Button>
        {!!fileName && !run.isPending && (
          <View style={styles.row}>
            <FileText size={14} color={colors.mutedForeground} />
            <Text variant="small">{fileName}</Text>
          </View>
        )}
      </View>
      {result && (
        <Text variant="small">
          {t('ics.result').replace('{created}', String(result.created)).replace('{skipped}', String(result.skipped))}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
