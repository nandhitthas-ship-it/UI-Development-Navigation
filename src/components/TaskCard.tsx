import { Check, Trash2 } from "lucide-react";
import { categoryOf, type Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = categoryOf(task.category);

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-label={task.done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
        aria-pressed={task.done}
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
          task.done ? "border-brand bg-brand text-primary-foreground" : "border-border bg-background",
        )}
      >
        {task.done ? <Check className="size-4" strokeWidth={3} /> : null}
      </button>

      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-[15px] font-semibold leading-snug text-foreground",
            task.done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        {task.note ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.note}</p>
        ) : null}
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
            cat.chip,
          )}
        >
          <span className={cn("size-1.5 rounded-full", cat.dot)} />
          {cat.label}
        </span>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${task.title}`}
        className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
