import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Screen } from "@/components/Screen";
import { TaskCard } from "@/components/TaskCard";
import { CATEGORIES, useTasks, type CategoryId } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Tapkeep To-Do" },
      {
        name: "description",
        content: "A mobile-first to-do list: add tasks, tick them off, and sort them by category.",
      },
      { property: "og:title", content: "Today — Tapkeep To-Do" },
      {
        property: "og:description",
        content: "A mobile-first to-do list: add tasks, tick them off, and sort them by category.",
      },
    ],
  }),
  component: TasksScreen,
});

function TasksScreen() {
  const { tasks, toggleTask, deleteTask } = useTasks();
  const [filter, setFilter] = React.useState<CategoryId | "all">("all");

  const visible = tasks.filter((t) => filter === "all" || t.category === filter);
  const open = tasks.filter((t) => !t.done).length;

  return (
    <Screen
      title="Today"
      subtitle={open === 0 ? "All clear. Nice work." : `${open} task${open === 1 ? "" : "s"} left`}
      action={
        <Link
          to="/new"
          aria-label="Add a task"
          className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-card transition-transform active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </Link>
      }
    >
      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {(["all", ...CATEGORIES.map((c) => c.id)] as const).map((id) => {
          const label = id === "all" ? "All" : CATEGORIES.find((c) => c.id === id)!.label;
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "border-brand bg-brand text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-bold text-foreground">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the plus button to add your first task.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </Screen>
  );
}
