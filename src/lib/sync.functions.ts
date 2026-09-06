import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RemoteTask = {
  id: string;
  title: string;
  note: string | null;
  category: string;
  done: boolean;
  deleted: boolean;
  updated_at: string;
  created_at: string;
};

type PushInput = {
  tasks: Array<{
    id: string;
    title: string;
    note: string | null;
    category: string;
    done: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

/** Pull every task row for the signed-in user (tombstones included). */
export const pullTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tasks")
      .select("id, title, note, category, done, deleted, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { tasks: (data ?? []) as RemoteTask[] };
  });

/** Push locally queued changes (adds, edits, deletes) in one batch. */
export const pushTasks = createServerFn({ method: "POST" })
  .inputValidator((input: PushInput) => {
    if (!input || !Array.isArray(input.tasks)) throw new Error("Invalid payload");
    for (const t of input.tasks) {
      if (typeof t.id !== "string" || t.id.length < 8) throw new Error("Invalid task id");
      const title = String(t.title ?? "").trim();
      if (title.length < 3 || title.length > 80) throw new Error("Invalid task title");
    }
    return input;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    if (data.tasks.length === 0) return { synced: 0 };
    const rows = data.tasks.map((t) => ({
      id: t.id,
      user_id: context.userId,
      title: t.title.trim().slice(0, 80),
      note: t.note ? t.note.slice(0, 160) : null,
      category: t.category,
      done: t.done,
      deleted: t.deleted,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }));
    const { error } = await context.supabase.from("tasks").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { synced: rows.length };
  });
