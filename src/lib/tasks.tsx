import * as React from "react";

export type CategoryId = "personal" | "work" | "errands" | "health";

export type Category = {
  id: CategoryId;
  label: string;
  /** tailwind classes for the category chip */
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

export type Task = {
  id: string;
  title: string;
  note?: string;
  category: CategoryId;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = "tasks.v1";

const SEED: Task[] = [
  {
    id: "seed-1",
    title: "Pack gym bag for tomorrow",
    note: "Shoes, towel, water bottle",
    category: "health",
    done: false,
    createdAt: Date.now() - 5000,
  },
  {
    id: "seed-2",
    title: "Send design handoff to Priya",
    category: "work",
    done: false,
    createdAt: Date.now() - 4000,
  },
  {
    id: "seed-3",
    title: "Pick up parcel from the post office",
    category: "errands",
    done: false,
    createdAt: Date.now() - 3000,
  },
  {
    id: "seed-4",
    title: "Call grandma",
    category: "personal",
    done: true,
    createdAt: Date.now() - 2000,
  },
];

type Ctx = {
  tasks: Task[];
  addTask: (input: { title: string; note?: string; category: CategoryId }) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
};

const TasksContext = React.createContext<Ctx | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = React.useState<Task[]>(SEED);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  const value = React.useMemo<Ctx>(
    () => ({
      tasks,
      addTask: ({ title, note, category }) =>
        setTasks((prev) => {
          const trimmedNote = note?.trim();
          const task: Task = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: title.trim(),
            category,
            done: false,
            createdAt: Date.now(),
            ...(trimmedNote ? { note: trimmedNote } : {}),
          };
          return [task, ...prev];
        }),
      deleteTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
      toggleTask: (id) =>
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    }),
    [tasks],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = React.useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside TasksProvider");
  return ctx;
}
