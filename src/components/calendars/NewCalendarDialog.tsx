import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CALENDAR_COLORS } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { createCalendar } from '@/src/services/calendars';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import type { CalendarColor } from '@/src/services/types';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Input, Textarea } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Sheet } from '@/src/ui/Sheet';
import { toast } from '@/src/ui/Toast';

export function NewCalendarDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return <Sheet open={false} onClose={onClose} />;
  return <NewCalendarForm onClose={onClose} />;
}

function NewCalendarForm({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<CalendarColor>('violet');
  const create = useServiceMutation(() => createCalendar({ name, description, color }), [queryKeys.calendars]);

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('ndlg.title')}
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            {t('act.cancel')}
          </Button>
          <Button
            disabled={!name.trim()}
            loading={create.isPending}
            onPress={() =>
              create.mutate(undefined, {
                onSuccess: () => {
                  toast.success(t('ndlg.toastCreated'));
                  onClose();
                },
                onError: () => toast.error(t('ndlg.toastErr')),
              })
            }
          >
            {create.isPending ? t('ndlg.creating') : t('ndlg.create')}
          </Button>
        </>
      }
    >
      <View style={styles.field}>
        <Label>{t('ndlg.name')}</Label>
        <Input value={name} onChangeText={setName} placeholder={t('ndlg.namePh')} maxLength={60} />
      </View>
      <View style={styles.field}>
        <Label>{t('ndlg.desc')}</Label>
        <Textarea value={description} onChangeText={setDescription} placeholder={t('ndlg.descPh')} numberOfLines={3} maxLength={300} />
      </View>
      <View style={styles.field}>
        <Label>{t('ndlg.color')}</Label>
        <View style={styles.colors}>
          {CALENDAR_COLORS.map((c) => {
            const active = color === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setColor(c.id)}
                accessibilityLabel={c.label}
                accessibilityState={{ selected: active }}
                style={[styles.ring, active && { borderColor: colors.primary }]}
              >
                <View style={[styles.swatch, { backgroundColor: c.dot, opacity: active ? 1 : 0.7 }]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ring: { padding: 2, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 32, height: 32, borderRadius: 16 },
});
