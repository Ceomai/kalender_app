import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { priorityOf } from '@/src/constants/categories';
import { tRaw, useT } from '@/src/i18n';
import { monthName, parseDateInput } from '@/src/lib/calendar-utils';
import type { Task } from '@/src/services/types';
import { FONTS, RADII, alpha, useTheme } from '@/src/theme';
import { Text } from '@/src/ui/Text';

/** "Today", "Tomorrow", "3 days late" or "12 Oct" for a due date. */
export function dueLabel(due: string | null, now = new Date()) {
  if (!due) return null;
  const target = parseDateInput(String(due).slice(0, 10));
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { text: tRaw('ti.today'), overdue: false };
  if (diff === 1) return { text: tRaw('ti.tomorrow'), overdue: false };
  if (diff < 0) return { text: tRaw('ti.overdue').replace('{n}', String(Math.abs(diff))), overdue: true };
  return { text: `${target.getDate()} ${monthName(target.getMonth()).slice(0, 3)}`, overdue: false };
}

type Props = { task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void };

/** One task row: check circle, title/notes, priority and due badges, edit/delete. */
export function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const prio = priorityOf(task.priority);
  const due = dueLabel(task.due_date);
  const late = due?.overdue && !task.completed;

  return (
    <View
      style={[
        styles.row,
        { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card },
        task.completed && { opacity: 0.6 },
      ]}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.completed ? t('ti.completed') : t('ti.incomplete')}
        style={styles.check}
      >
        {task.completed ? (
          <CheckCircle2 size={20} color="#10b981" />
        ) : (
          <Circle size={20} color={alpha(colors.mutedForeground, 0.6)} />
        )}
      </Pressable>

      <Pressable onPress={onEdit} style={styles.body}>
        <Text variant="medium" style={task.completed && styles.strike}>
          {task.title}
        </Text>
        {!!task.description && (
          <Text variant="small" numberOfLines={1} style={styles.desc}>
            {task.description}
          </Text>
        )}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: prio.chip.bg, borderColor: prio.chip.border }]}>
            <View style={[styles.dot, { backgroundColor: prio.chip.dot }]} />
            <Text style={[styles.badgeText, { color: prio.chip.fg }]}>{prio.label}</Text>
          </View>
          {due && (
            <View
              style={[
                styles.badge,
                late
                  ? { backgroundColor: '#fef2f2', borderColor: '#fecaca' }
                  : { borderColor: alpha(colors.border, 0.6) },
              ]}
            >
              <Text style={[styles.badgeText, { color: late ? '#b91c1c' : colors.mutedForeground }]}>{due.text}</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={onEdit} hitSlop={6} style={styles.iconBtn} accessibilityLabel={t('ti.edit')}>
          <Pencil size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={6} style={styles.iconBtn} accessibilityLabel={t('act.delete')}>
          <Trash2 size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: RADII['2xl'], padding: 14 },
  check: { marginTop: 1 },
  body: { flex: 1, minWidth: 0 },
  strike: { textDecorationLine: 'line-through' },
  desc: { marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADII.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: FONTS.bodyMedium, fontSize: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 2 },
  iconBtn: { padding: 6, borderRadius: RADII.md - 4 },
});
