import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Screen } from "@/components/Screen";
import { TaskCard } from "@/components/TaskCard";
import { CATEGORIES, useTasks, type CategoryId } from "@/lib/tasks";

export const Route = createFileRoute("/categories/$categoryId")({
  head: () => ({
    meta: [
      { title: "Category tasks — Tapkeep To-Do" },
      { name: "description", content: "All the tasks filed under one category." },
      { property: "og:title", content: "Category tasks — Tapkeep To-Do" },
      { property: "og:description", content: "All the tasks filed under one category." },
    ],
  }),
  component: CategoryDetail,
});

function CategoryDetail() {
  const { categoryId } = Route.useParams();
  const { tasks, toggleTask, deleteTask } = useTasks();
  const category = CATEGORIES.find((c) => c.id === (categoryId as CategoryId));
  const list = tasks.filter((t) => t.category === categoryId);

  return (
    <Screen
      title={category?.label ?? "Unknown"}
      subtitle={`${list.filter((t) => !t.done).length} open task(s)`}
      action={
        <Link
          to="/categories"
          aria-label="Back to categories"
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>
      }
    >
      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No tasks in this category yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((task) => (
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
