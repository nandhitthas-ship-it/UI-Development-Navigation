import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen } from "@/components/Screen";
import { CATEGORIES, useTasks } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Tapkeep To-Do" },
      { name: "description", content: "See how your tasks are split across your categories." },
      { property: "og:title", content: "Categories — Tapkeep To-Do" },
      {
        property: "og:description",
        content: "See how your tasks are split across your categories.",
      },
    ],
  }),
  component: CategoriesScreen,
});

function CategoriesScreen() {
  const { tasks } = useTasks();

  return (
    <Screen title="Categories" subtitle="Tap one to see just those tasks.">
      <ul className="space-y-3">
        {CATEGORIES.map((c) => {
          const all = tasks.filter((t) => t.category === c.id);
          const open = all.filter((t) => !t.done).length;
          const pct = all.length === 0 ? 0 : Math.round(((all.length - open) / all.length) * 100);
          return (
            <li key={c.id}>
              <Link
                to="/categories/$categoryId"
                params={{ categoryId: c.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-card"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2.5 shrink-0 rounded-full", c.dot)} />
                    <p className="truncate font-display text-base font-bold text-foreground">
                      {c.label}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {open} open · {all.length} total
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", c.dot)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Screen>
  );
}
