import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { pullTasks, pushTasks } from "./sync.functions";

export type CategoryId = "personal" | "work" | "errands" | "health";

export type Category = {
  id: CategoryId;
  label: string;
  chip: string;
  dot: string;
};

export const CATEGORIES: Category[] = [
  { id: "personal", label: "Personal", chip: "bg-brand-soft text-brand-ink", dot: "bg-brand" },
  { id: "work", label: "Work", chip: "bg-accent text-accent-foreground", dot: "bg-ink" },
  { id: "errands", label: "Errands", chip: "bg-lime-soft text-brand-ink", dot: "bg-lime" },
  { id: "health", label: "Health", chip: "bg-berry-soft text-brand-ink", dot: "bg-berry" },
];

export function categoryOf(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]!;
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export type Task = {
  id: string;
  title: string;
  note?: string;
  category: CategoryId;
  done: boolean;
  /** soft delete so the change can be replayed to the cloud after reconnect */
  deleted: boolean;
  /** true while the change still waits in the offline queue */
  dirty: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "tapkeep.tasks.v2";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function seed(): Task[] {
  const now = new Date().toISOString();
  const base = { deleted: false, dirty: true, createdAt: now, updatedAt: now };
  return [
    {
      id: uuid(),
      title: "Pack gym bag for tomorrow",
      note: "Shoes, towel, water bottle",
      category: "health",
      done: false,
      ...base,
    },
    { id: uuid(), title: "Send design handoff to Priya", category: "work", done: false, ...base },
    {
      id: uuid(),
      title: "Pick up parcel from the post office",
      category: "errands",
      done: false,
      ...base,
    },
    { id: uuid(), title: "Call grandma", category: "personal", done: true, ...base },
  ];
}

export type SyncState = "offline" | "signed-out" | "pending" | "synced" | "error";

type Ctx = {
  /** live (not deleted) tasks */
  tasks: Task[];
  addTask: (input: { title: string; note?: string; category: CategoryId }) => void;
  updateTask: (
    id: string,
    changes: { title?: string; note?: string; category?: CategoryId },
  ) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  online: boolean;
  signedIn: boolean;
  pendingCount: number;
  syncState: SyncState;
  syncNow: () => void;
};

const TasksContext = React.createContext<Ctx | null>(null);

function load(): Task[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : null;
  } catch {
    return null;
  }
}

/** last-write-wins merge between the local cache and the cloud copy */
function merge(local: Task[], remote: Task[]): Task[] {
  const byId = new Map<string, Task>();
  for (const t of remote) byId.set(t.id, t);
  for (const t of local) {
    const r = byId.get(t.id);
    if (!r) {
      byId.set(t.id, t);
    } else if (t.dirty || new Date(t.updatedAt) > new Date(r.updatedAt)) {
      byId.set(t.id, t);
    }
  }
  return [...byId.values()];
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = React.useState<Task[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const [signedIn, setSignedIn] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState(false);

  // hydrate from the device cache (works with no network at all)
  React.useEffect(() => {
    setAll(load() ?? seed());
    setHydrated(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* storage full or blocked — the app keeps working in memory */
    }
  }, [all, hydrated]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setSignedIn(!!session);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const allRef = React.useRef(all);
  allRef.current = all;

  const sync = React.useCallback(async () => {
    if (!signedIn || !online) return;
    setSyncing(true);
    setError(false);
    try {
      const dirty = allRef.current.filter((t) => t.dirty);
      if (dirty.length > 0) {
        await pushTasks({
          data: {
            tasks: dirty.map((t) => ({
              id: t.id,
              title: t.title,
              note: t.note ?? null,
              category: t.category,
              done: t.done,
              deleted: t.deleted,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
            })),
          },
        });
      }
      const { tasks: remote } = await pullTasks();
      const mapped: Task[] = remote.map((r) => ({
        id: r.id,
        title: r.title,
        ...(r.note ? { note: r.note } : {}),
        category: (isCategoryId(r.category) ? r.category : "personal") as CategoryId,
        done: r.done,
        deleted: r.deleted,
        dirty: false,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      setAll((prev) => {
        const stillDirty = prev.filter(
          (t) => t.dirty && !dirty.some((d) => d.id === t.id && d.updatedAt === t.updatedAt),
        );
        return merge(stillDirty, mapped);
      });
    } catch {
      setError(true);
    } finally {
      setSyncing(false);
    }
  }, [signedIn, online]);

  // sync on sign-in, on reconnect, and whenever the offline queue has work
  const pendingCount = all.filter((t) => t.dirty).length;
  React.useEffect(() => {
    if (!hydrated || !signedIn || !online) return;
    const id = window.setTimeout(() => void sync(), 400);
    return () => window.clearTimeout(id);
  }, [hydrated, signedIn, online, pendingCount, sync]);

  const value = React.useMemo<Ctx>(() => {
    const touch = (t: Task): Task => ({ ...t, dirty: true, updatedAt: new Date().toISOString() });
    return {
      tasks: all
        .filter((t) => !t.deleted)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      getTask: (id) => all.find((t) => t.id === id && !t.deleted),
      addTask: ({ title, note, category }) =>
        setAll((prev) => {
          const now = new Date().toISOString();
          const trimmed = note?.trim();
          const task: Task = {
            id: uuid(),
            title: title.trim(),
            category,
            done: false,
            deleted: false,
            dirty: true,
            createdAt: now,
            updatedAt: now,
            ...(trimmed ? { note: trimmed } : {}),
          };
          return [task, ...prev];
        }),
      updateTask: (id, changes) =>
        setAll((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t;
            const note = changes.note?.trim();
            const next: Task = {
              ...t,
              ...(changes.title !== undefined ? { title: changes.title.trim() } : {}),
              ...(changes.category !== undefined ? { category: changes.category } : {}),
            };
            if (changes.note !== undefined) {
              if (note) next.note = note;
              else delete next.note;
            }
            return touch(next);
          }),
        ),
      deleteTask: (id) =>
        setAll((prev) => prev.map((t) => (t.id === id ? touch({ ...t, deleted: true }) : t))),
      toggleTask: (id) =>
        setAll((prev) => prev.map((t) => (t.id === id ? touch({ ...t, done: !t.done }) : t))),
      online,
      signedIn,
      pendingCount,
      syncState: !online
        ? "offline"
        : !signedIn
          ? "signed-out"
          : error
            ? "error"
            : pendingCount > 0 || syncing
              ? "pending"
              : "synced",
      syncNow: () => void sync(),
    };
  }, [all, online, signedIn, pendingCount, syncing, error, sync]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = React.useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside TasksProvider");
  return ctx;
}
