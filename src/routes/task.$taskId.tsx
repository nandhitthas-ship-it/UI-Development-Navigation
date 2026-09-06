import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/Screen";
import { CATEGORIES, useTasks, type CategoryId } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Edit task — Tapkeep To-Do" },
      { name: "description", content: "Change a task's wording, note or category." },
      { property: "og:title", content: "Edit task — Tapkeep To-Do" },
      { property: "og:description", content: "Change a task's wording, note or category." },
    ],
  }),
  component: EditTaskScreen,
});

function validate(value: string) {
  const v = value.trim();
  if (v.length === 0) return "Please write what needs doing.";
  if (v.length < 3) return "Use at least 3 characters.";
  if (v.length > 80) return "Keep it under 80 characters.";
  return null;
}

function EditTaskScreen() {
  const { taskId } = Route.useParams();
  const { getTask, updateTask, deleteTask } = useTasks();
  const navigate = useNavigate();
  const task = getTask(taskId);

  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId>("personal");
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (task && !loaded) {
      setTitle(task.title);
      setNote(task.note ?? "");
      setCategory(task.category);
      setLoaded(true);
    }
  }, [task, loaded]);

  if (!task) {
    return (
      <Screen title="Task not found" subtitle="It may have been deleted.">
        <Link
          to="/"
          className="grid h-13 w-full place-items-center rounded-2xl bg-brand text-base font-bold text-primary-foreground"
        >
          Back to tasks
        </Link>
      </Screen>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(title);
    setError(err);
    if (err) return;
    updateTask(taskId, { title, note, category });
    toast.success("Task updated");
    navigate({ to: "/" });
  }

  return (
    <Screen
      title="Edit task"
      subtitle="Changes save straight away, even offline."
      action={
        <Link
          to="/"
          aria-label="Back to tasks"
          className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border bg-card text-foreground"
        >
          <ChevronLeft className="size-5" />
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-foreground">
            Task
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(validate(e.target.value));
            }}
            aria-invalid={!!error}
            className={cn(
              "mt-2 h-13 w-full rounded-2xl border bg-card px-4 text-base text-foreground outline-none focus:border-brand",
              error ? "border-destructive" : "border-border",
            )}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <span className="shrink-0 text-xs text-muted-foreground">{title.trim().length}/80</span>
          </div>
        </div>

        <div>
          <label htmlFor="note" className="text-sm font-semibold text-foreground">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 160))}
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-card p-4 text-base text-foreground outline-none focus:border-brand"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-foreground">Category</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                  category === c.id
                    ? "border-brand bg-brand-soft text-brand-ink"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className={cn("size-2.5 rounded-full", c.dot)} />
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="h-13 w-full rounded-2xl bg-brand text-base font-bold text-primary-foreground shadow-card"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={() => {
            deleteTask(taskId);
            toast.success("Task deleted");
            navigate({ to: "/" });
          }}
          className="h-13 w-full rounded-2xl border border-destructive/40 text-base font-bold text-destructive"
        >
          Delete task
        </button>
      </form>
    </Screen>
  );
}
