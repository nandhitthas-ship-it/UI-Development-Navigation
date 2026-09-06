import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { Screen } from "@/components/Screen";
import { TaskCard } from "@/components/TaskCard";
import { CATEGORIES } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/style-guide")({
  head: () => ({
    meta: [
      { title: "Style guide — Tapkeep To-Do" },
      {
        name: "description",
        content: "Every button, input, chip and task card in one screenshot-ready screen.",
      },
      { property: "og:title", content: "Style guide — Tapkeep To-Do" },
      {
        property: "og:description",
        content: "Every button, input, chip and task card in one screenshot-ready screen.",
      },
    ],
  }),
  component: StyleGuide,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function StyleGuide() {
  return (
    <Screen title="Style guide" subtitle="A screenshot-ready view of every component.">
      <Section title="Buttons">
        <button className="h-13 w-full rounded-2xl bg-brand text-base font-bold text-primary-foreground shadow-card">
          Primary action
        </button>
        <button className="h-13 w-full rounded-2xl border border-border bg-card text-base font-bold text-foreground">
          Secondary action
        </button>
        <div className="flex items-center gap-3">
          <button className="grid size-11 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-card">
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
          <button className="grid size-11 place-items-center rounded-2xl border border-border bg-card text-muted-foreground">
            <Trash2 className="size-4" />
          </button>
          <button className="grid size-7 place-items-center rounded-full border-2 border-brand bg-brand text-primary-foreground">
            <Check className="size-4" strokeWidth={3} />
          </button>
        </div>
      </Section>

      <Section title="Form inputs">
        <input
          readOnly
          value="Water the plants"
          className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground"
        />
        <input
          readOnly
          placeholder="Placeholder text"
          className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-base"
        />
        <div>
          <input
            readOnly
            value="No"
            aria-invalid
            className="h-13 w-full rounded-2xl border border-destructive bg-card px-4 text-base text-foreground"
          />
          <p className="mt-1.5 text-sm text-destructive">Use at least 3 characters.</p>
        </div>
        <textarea
          readOnly
          rows={3}
          value="An optional note that wraps onto more than one line."
          className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-base text-foreground"
        />
      </Section>

      <Section title="Category chips">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                c.chip,
              )}
            >
              <span className={cn("size-1.5 rounded-full", c.dot)} />
              {c.label}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Task cards">
        <ul className="space-y-3">
          <TaskCard
            task={{
              id: "demo-1",
              title: "Task card with a note",
              note: "Notes sit under the title and clamp after two lines.",
              category: "work",
              done: false,
              createdAt: 0,
            }}
            onToggle={() => {}}
            onDelete={() => {}}
          />
          <TaskCard
            task={{
              id: "demo-2",
              title: "Completed task",
              category: "health",
              done: true,
              createdAt: 0,
            }}
            onToggle={() => {}}
            onDelete={() => {}}
          />
        </ul>
      </Section>

      <Section title="Empty state">
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-bold text-foreground">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the plus button to add your first task.
          </p>
        </div>
      </Section>
    </Screen>
  );
}
