import { CheckSquare, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PageHeader } from '@/src/components/layout/PageHeader';
import { Screen } from '@/src/components/layout/Screen';
import { TaskDialog } from '@/src/components/tasks/TaskDialog';
import { TaskItem } from '@/src/components/tasks/TaskItem';
import { useT } from '@/src/i18n';
import { queryKeys, useServiceMutation, useTasks } from '@/src/services/queries';
import { deleteTask, updateTask } from '@/src/services/tasks';
import type { Task } from '@/src/services/types';
import { RADII, alpha, useTheme } from '@/src/theme';
import { Button } from '@/src/ui/Button';
import { ConfirmDialog } from '@/src/ui/ConfirmDialog';
import { LoadingCard } from '@/src/ui/EmptyState';
import { Segmented } from '@/src/ui/Pill';
import { SearchInput } from '@/src/ui/SearchInput';
import { Text } from '@/src/ui/Text';

type Filter = 'all' | 'active' | 'completed';
const PRIORITY_SORT = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function TasksScreen() {
  const { colors } = useTheme();
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ task: Task | null } | null>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const tasksQuery = useTasks();
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'active') list = list.filter((tk) => !tk.completed);
    if (filter === 'completed') list = list.filter((tk) => tk.completed);
    const q = search.trim().toLocaleLowerCase('tr');
    if (q) list = list.filter((tk) => `${tk.title} ${tk.description}`.toLocaleLowerCase('tr').includes(q));
    return [...list].sort((a, b) =>
      a.completed !== b.completed ? (a.completed ? 1 : -1) : PRIORITY_SORT[a.priority] - PRIORITY_SORT[b.priority],
    );
  }, [tasks, filter, search]);

  const counts = {
    all: tasks.length,
    active: tasks.filter((tk) => !tk.completed).length,
    completed: tasks.filter((tk) => tk.completed).length,
  };

  const toggle = useServiceMutation((task: Task) => updateTask(task.id, { completed: !task.completed }), [queryKeys.tasks]);
  const remove = useServiceMutation((task: Task) => deleteTask(task.id), [queryKeys.tasks]);

  return (
    <Screen>
      <PageHeader
        eyebrow={t('task.eyebrow')}
        title={t('task.title')}
        action={
          <Button icon={Plus} onPress={() => setDialog({ task: null })}>
            {t('task.new')}
          </Button>
        }
      />

      <View style={styles.controls}>
        <SearchInput value={search} onChangeText={setSearch} placeholder={t('task.search')} />
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={(['all', 'active', 'completed'] as Filter[]).map((id) => ({
            value: id,
            label: `${t(`task.filter.${id}`)} ${counts[id]}`,
          }))}
        />
      </View>

      {tasksQuery.isPending ? (
        <LoadingCard />
      ) : filtered.length === 0 ? (
        <View style={[styles.empty, { borderColor: alpha(colors.border, 0.7), backgroundColor: colors.card }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <CheckSquare size={24} color={colors.mutedForeground} />
          </View>
          <Text variant="medium">{t('task.empty')}</Text>
          <Text variant="small" style={styles.center}>
            {t('task.emptyDesc')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggle.mutate(task)}
              onEdit={() => setDialog({ task })}
              onDelete={() => setToDelete(task)}
            />
          ))}
        </View>
      )}

      <TaskDialog open={!!dialog} onClose={() => setDialog(null)} task={dialog?.task ?? null} />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t('task.deleteTitle')}
        description={t('task.deleteDesc').replace('{name}', toDelete?.title ?? '')}
        confirmLabel={t('act.delete')}
        busy={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete, { onSuccess: () => setToDelete(null) })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  empty: { borderWidth: 1, borderRadius: RADII['3xl'], paddingHorizontal: 20, paddingVertical: 64, alignItems: 'center', gap: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: RADII['2xl'], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { textAlign: 'center' },
  list: { gap: 10 },
});
