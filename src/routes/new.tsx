import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen } from "@/components/Screen";
import { CATEGORIES, useTasks, type CategoryId } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Add a task — Tapkeep To-Do" },
      { name: "description", content: "Create a new task with a title, note and category." },
      { property: "og:title", content: "Add a task — Tapkeep To-Do" },
      {
        property: "og:description",
        content: "Create a new task with a title, note and category.",
      },
    ],
  }),
  component: NewTaskScreen,
});

function NewTaskScreen() {
  const { addTask } = useTasks();
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId>("personal");
  const [error, setError] = React.useState<string | null>(null);

  function validate(value: string) {
    const v = value.trim();
    if (v.length === 0) return "Please write what needs doing.";
    if (v.length < 3) return "Use at least 3 characters.";
    if (v.length > 80) return "Keep it under 80 characters.";
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(title);
    setError(err);
    if (err) return;
    addTask({ title, note, category });
    toast.success("Task added");
    navigate({ to: "/" });
  }

  return (
    <Screen title="New task" subtitle="Keep it short and doable.">
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
            placeholder="e.g. Water the plants"
            aria-invalid={!!error}
            aria-describedby={error ? "title-error" : undefined}
            className={cn(
              "mt-2 h-13 w-full rounded-2xl border bg-card px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand",
              error ? "border-destructive" : "border-border",
            )}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p id="title-error" className="text-sm text-destructive">
              {error}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">{title.trim().length}/80</span>
          </div>
        </div>

        <div>
          <label htmlFor="note" className="text-sm font-semibold text-foreground">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 160))}
            rows={3}
            placeholder="Any detail you'll want later"
            className="mt-2 w-full resize-none rounded-2xl border border-border bg-card p-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
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
          className="h-13 w-full rounded-2xl bg-brand text-base font-bold text-primary-foreground shadow-card transition-transform active:scale-[0.98]"
        >
          Add task
        </button>
      </form>
    </Screen>
  );
}
