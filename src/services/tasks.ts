// Web task-fns.js
import { db, unwrap } from '@/src/services/db';
import type { Priority, Task } from '@/src/services/types';

export type TaskInput = {
  title: string;
  description?: string;
  priority?: Priority;
  /** YYYY-MM-DD */
  due_date?: string | null;
};

/** All my tasks, newest first. */
export async function listTasks(): Promise<Task[]> {
  return unwrap(await db().from('tasks').select('*').order('created_date', { ascending: false }).limit(500));
}

export async function createTask(input: TaskInput): Promise<Task> {
  return unwrap(
    await db()
      .from('tasks')
      .insert({
        title: input.title.trim(),
        description: input.description ?? '',
        priority: input.priority || 'medium',
        due_date: input.due_date || null,
        completed: false,
        order: Date.now(),
      })
      .select()
      .single(),
  );
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput> & { completed?: boolean; order?: number },
): Promise<Task> {
  const data: Record<string, unknown> = { ...patch };
  if (patch.title !== undefined) data.title = patch.title.trim();
  if ('due_date' in patch) data.due_date = patch.due_date || null;
  return unwrap(await db().from('tasks').update(data).eq('id', id).select().single());
}

export async function deleteTask(id: string): Promise<{ ok: true }> {
  unwrap(await db().from('tasks').delete().eq('id', id));
  return { ok: true };
}
