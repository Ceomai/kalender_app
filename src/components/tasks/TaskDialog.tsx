import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PRIORITIES } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { queryKeys, useServiceMutation } from '@/src/services/queries';
import { createTask, updateTask, type TaskInput } from '@/src/services/tasks';
import type { Priority, Task } from '@/src/services/types';
import { Button } from '@/src/ui/Button';
import { DateField } from '@/src/ui/DateField';
import { Input, Textarea } from '@/src/ui/Input';
import { Label } from '@/src/ui/Label';
import { Pill, PillRow } from '@/src/ui/Pill';
import { Sheet } from '@/src/ui/Sheet';
import { toast } from '@/src/ui/Toast';

type Props = { open: boolean; onClose: () => void; task: Task | null };

export function TaskDialog(props: Props) {
  if (!props.open) return <Sheet open={false} onClose={props.onClose} />;
  return <TaskForm key={props.task?.id ?? 'new'} {...props} />;
}

function TaskForm({ onClose, task }: Props) {
  const t = useT();
  const editing = !!task;
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: (task?.priority ?? 'medium') as Priority,
    due_date: task?.due_date ? String(task.due_date).slice(0, 10) : '',
  });
  const set = (patch: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...patch }));

  const save = useServiceMutation(
    (payload: TaskInput) => (task ? updateTask(task.id, payload) : createTask(payload)),
    [queryKeys.tasks],
  );

  const handleSave = () => {
    if (!form.title.trim()) return;
    save.mutate(
      { title: form.title.trim(), description: form.description, priority: form.priority, due_date: form.due_date || null },
      {
        onSuccess: () => {
          toast.success(editing ? t('td.toastUpdated') : t('td.toastCreated'));
          onClose();
        },
        onError: () => toast.error(t('td.toastErr')),
      },
    );
  };

  return (
    <Sheet open onClose={onClose} title={editing ? t('td.edit') : t('td.new')}>
      <View style={styles.field}>
        <Label>{t('td.title')}</Label>
        <Input value={form.title} onChangeText={(title) => set({ title })} placeholder={t('td.titlePh')} autoFocus maxLength={160} />
      </View>
      <View style={styles.field}>
        <Label>{t('td.priority')}</Label>
        <PillRow wrap>
          {PRIORITIES.map((p) => (
            <Pill
              key={p.id}
              label={p.label}
              dot={p.chip.dot}
              colors={p.chip}
              selected={form.priority === p.id}
              onPress={() => set({ priority: p.id })}
            />
          ))}
        </PillRow>
      </View>
      <View style={styles.field}>
        <Label>{t('td.due')}</Label>
        <DateField mode="date" value={form.due_date} onChange={(due_date) => set({ due_date })} clearable />
      </View>
      <View style={styles.field}>
        <Label>{t('td.note')}</Label>
        <Textarea value={form.description} onChangeText={(description) => set({ description })} numberOfLines={2} maxLength={2000} />
      </View>
      <Button disabled={!form.title.trim()} loading={save.isPending} onPress={handleSave} style={styles.full}>
        {save.isPending ? t('act.saving') : t('act.save')}
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  full: { width: '100%' },
});
