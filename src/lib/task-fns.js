import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";

const PRIORITIES = ["low", "medium", "high", "urgent"];

// Kullanıcının tüm görevleri (en yeni önce).
export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const page = await context
      .getBase44()
      .entities.Task.filter({}, { sort: "-created_date", limit: 500 });
    return page.items;
  });

// Yeni görev.
export const createTask = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      title: z.string().trim().min(1).max(160),
      description: z.string().max(1000).optional(),
      priority: z.enum(PRIORITIES).optional(),
      due_date: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    return context.getBase44().entities.Task.create({
      title: data.title,
      description: data.description || "",
      priority: data.priority || "medium",
      due_date: data.due_date || null,
      completed: false,
      order: Date.now(),
    });
  });

// Görev güncelleme (alanların hepsi isteğe bağlı).
export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      title: z.string().trim().min(1).max(160).optional(),
      description: z.string().max(1000).optional(),
      priority: z.enum(PRIORITIES).optional(),
      due_date: z.string().nullable().optional(),
      completed: z.boolean().optional(),
    }),
  )
  .handler(async ({ data: { id, ...patch }, context }) => {
    return context.getBase44().entities.Task.update(id, patch);
  });

// Görev silme.
export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.Task.delete(data.id);
    return { ok: true };
  });