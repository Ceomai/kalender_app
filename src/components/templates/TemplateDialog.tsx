import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import { createTemplate } from '@/src/services/templates';
import type { Priority } from '@/src/services/types';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Input, Textarea } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Pill, PillRow } from '@/src/ui/Pill';
import { Select } from '@/src/ui/Select';
import { Sheet } from '@/src/ui/Sheet';
import { Switch } from '@/src/ui/Switch';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480];

export function durationLabel(t: (key: string) => string, minutes: number) {
  return minutes < 60 ? t('tpl.dur.min').replace('{n}', String(minutes)) : t('tpl.dur.hr').replace('{n}', String(minutes / 60));
}

export function TemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return <Sheet open={false} onClose={onClose} />;
  return <TemplateForm onClose={onClose} />;
}

function TemplateForm({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    category: 'personal',
    priority: 'medium' as Priority,
    duration: 60,
    allDay: false,
    reminder: 30,
  });
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = useServiceMutation(
    () =>
      createTemplate({
        name: form.name.trim(),
        title: form.title.trim(),
        description: form.description,
        location: form.location,
        category: form.category,
        priority: form.priority,
        duration_minutes: form.allDay ? 60 : form.duration,
        all_day: form.allDay,
        reminder_minutes: form.reminder,
      }),
    [queryKeys.templates],
  );

  return (
    <Sheet open onClose={onClose} title={t('tdlg.title')}>
      <View style={styles.field}>
        <Label>{t('tdlg.name')}</Label>
        <Input value={form.name} onChangeText={(name) => set({ name })} placeholder={t('tdlg.namePh')} maxLength={60} />
      </View>
      <View style={styles.field}>
        <Label>{t('tdlg.eventTitle')}</Label>
        <Input value={form.title} onChangeText={(title) => set({ title })} placeholder={t('tdlg.eventTitlePh')} maxLength={120} />
      </View>
      <View style={styles.field}>
        <Label>{t('tdlg.category')}</Label>
        <PillRow wrap>
          {CATEGORIES.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              icon={c.icon}
              colors={c.chip}
              selected={form.category === c.id}
              onPress={() => set({ category: c.id })}
            />
          ))}
        </PillRow>
      </View>
      <View style={styles.field}>
        <Label>{t('tdlg.priority')}</Label>
        <PillRow wrap>
          {PRIORITIES.map((p) => (
            <Pill key={p.id} label={p.label} dot={p.chip.dot} colors={p.chip} selected={form.priority === p.id} onPress={() => set({ priority: p.id })} />
          ))}
        </PillRow>
      </View>
      <View style={[styles.switchBox, { borderColor: alpha(colors.border, 0.7) }]}>
        <Text>{t('tdlg.allDay')}</Text>
        <Switch value={form.allDay} onValueChange={(allDay) => set({ allDay })} />
      </View>
      {!form.allDay && (
        <View style={styles.cols}>
          <View style={[styles.field, styles.col]}>
            <Label>{t('tdlg.duration')}</Label>
            <Select<string>
              value={String(form.duration)}
              title={t('tdlg.duration')}
              options={DURATIONS.map((d) => ({ value: String(d), label: durationLabel(t, d) }))}
              onChange={(v) => set({ duration: Number(v) })}
            />
          </View>
          <View style={[styles.field, styles.col]}>
            <Label>{t('tdlg.reminder')}</Label>
            <Select<string>
              value={String(form.reminder)}
              title={t('tdlg.reminder')}
              options={REMINDER_OPTIONS.map((o) => ({ value: String(o.minutes), label: o.label }))}
              onChange={(v) => set({ reminder: Number(v) })}
            />
          </View>
        </View>
      )}
      <View style={styles.field}>
        <Label>{t('tdlg.location')}</Label>
        <Input value={form.location} onChangeText={(location) => set({ location })} placeholder={t('tdlg.locationPh')} maxLength={160} />
      </View>
      <View style={styles.field}>
        <Label>{t('tdlg.note')}</Label>
        <Textarea value={form.description} onChangeText={(description) => set({ description })} numberOfLines={2} maxLength={2000} />
      </View>
      <Button
        disabled={!form.name.trim() || !form.title.trim()}
        loading={save.isPending}
        style={styles.full}
        onPress={() =>
          save.mutate(undefined, {
            onSuccess: () => {
              toast.success(t('tdlg.toastCreated'));
              onClose();
            },
            onError: () => toast.error(t('tdlg.toastErr')),
          })
        }
      >
        {save.isPending ? t('act.saving') : t('tdlg.save')}
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  col: { flexGrow: 1, flexBasis: 140 },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADII['2xl'],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  full: { width: '100%' },
});
