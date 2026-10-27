import { Calendar, CheckSquare, Clock, MapPin, Sparkles, Tag } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryOf, priorityOf } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { dateInputValue, toISO } from '@/src/lib/calendar-utils';
import { parseQuickAdd } from '@/src/lib/quick-add';
import { createEvent } from '@/src/services/events';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import { createTask } from '@/src/services/tasks';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { Input } from '@/src/ui/Input';
import { Sheet } from '@/src/ui/Sheet';
import { Text } from '@/src/ui/Text';
import { toast } from '@/src/ui/Toast';

const TASK_CHIP = { bg: '#ecfdf5', fg: '#047857', border: '#a7f3d0' };

/** Natural-language quick add with a live preview; creates an entry or a task. */
export function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return <Sheet open={false} onClose={onClose} />;
  return <QuickAddForm onClose={onClose} />;
}

function QuickAddForm({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const t = useT();
  const [text, setText] = useState('');
  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  const save = useServiceMutation(
    async () => {
      if (!parsed) throw new Error(t('qa.needText'));
      if (parsed.type === 'task') {
        return createTask({ title: parsed.title, priority: parsed.priority || 'medium', due_date: parsed.dueDate });
      }
      const dateOnly = parsed.date || dateInputValue(new Date());
      return createEvent({
        title: parsed.title,
        start_at: toISO(dateOnly, parsed.isAllDay ? '09:00' : parsed.startTime || '09:00'),
        end_at: parsed.endTime ? toISO(dateOnly, parsed.endTime) : null,
        all_day: parsed.isAllDay,
        category: 'personal',
        priority: parsed.priority || 'medium',
        location: parsed.location,
        repeat: 'none',
        reminder_minutes: [30],
        calendar_id: null,
      });
    },
    [queryKeys.events, queryKeys.tasks, queryKeys.upcoming],
  );

  const submit = () =>
    parsed &&
    save.mutate(undefined, {
      onSuccess: () => {
        toast.success(parsed.type === 'task' ? t('qa.toastTask') : t('qa.toastEvent'));
        onClose();
      },
      onError: () => toast.error(t('qa.toastErr')),
    });

  const cat = categoryOf('personal');
  const prio = parsed?.priority ? priorityOf(parsed.priority) : null;
  const typeChip = parsed?.type === 'task' ? TASK_CHIP : cat.chip;
  const TypeIcon = parsed?.type === 'task' ? CheckSquare : Calendar;
  const muted = colors.mutedForeground;

  return (
    <Sheet open onClose={onClose} title={t('qa.title')}>
      <View style={styles.titleRow}>
        <Sparkles size={18} color={colors.primary} />
        <Text variant="small">
          <Text variant="small" style={{ fontFamily: FONTS.bodyMedium }}>
            {t('qa.tips')}
          </Text>{' '}
          {t('qa.tipsBody')}
        </Text>
      </View>
      <Input autoFocus value={text} onChangeText={setText} placeholder={t('qa.placeholder')} returnKeyType="done" onSubmitEditing={submit} />

      {parsed && (
        <View style={[styles.preview, { borderColor: alpha(colors.border, 0.7), backgroundColor: alpha(colors.muted, 0.3) }]}>
          <View style={styles.inline}>
            <View style={[styles.chip, { backgroundColor: typeChip.bg, borderColor: typeChip.border }]}>
              <TypeIcon size={14} color={typeChip.fg} />
              <Text style={[styles.chipText, { color: typeChip.fg }]}>{parsed.type === 'task' ? t('qa.task') : t('qa.event')}</Text>
            </View>
            {prio && (
              <View style={[styles.chip, { backgroundColor: prio.chip.bg, borderColor: prio.chip.border }]}>
                <View style={[styles.dot, { backgroundColor: prio.chip.dot }]} />
                <Text style={[styles.chipText, { color: prio.chip.fg, fontFamily: FONTS.bodyMedium }]}>{prio.label}</Text>
              </View>
            )}
          </View>
          <Text variant="medium">{parsed.title}</Text>
          <View style={styles.meta}>
            {parsed.date && (
              <View style={styles.inline}>
                <Calendar size={14} color={muted} />
                <Text variant="small">{parsed.date}</Text>
              </View>
            )}
            {parsed.startTime && (
              <View style={styles.inline}>
                <Clock size={14} color={muted} />
                <Text variant="small">
                  {parsed.startTime}
                  {parsed.endTime ? ` – ${parsed.endTime}` : ''}
                </Text>
              </View>
            )}
            {!!parsed.location && (
              <View style={styles.inline}>
                <MapPin size={14} color={muted} />
                <Text variant="small">{parsed.location}</Text>
              </View>
            )}
            {parsed.isAllDay && parsed.type === 'event' && (
              <View style={styles.inline}>
                <Tag size={14} color={muted} />
                <Text variant="small">{t('time.allDay')}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <Button disabled={!parsed} loading={save.isPending} onPress={submit} style={styles.full}>
        {save.isPending ? t('act.adding') : t('act.create')}
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  preview: { borderWidth: 1, borderRadius: RADII['2xl'], padding: 12, gap: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: RADII.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: FONTS.bodySemi, fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  full: { width: '100%' },
});
