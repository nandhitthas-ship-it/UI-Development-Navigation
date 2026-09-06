import { Link } from "@tanstack/react-router";
import { BellRing, BookOpen, LayoutGrid, ListChecks, Plus } from "lucide-react";

const items = [
  { to: "/", label: "Tasks", icon: ListChecks, exact: true },
  { to: "/categories", label: "Groups", icon: LayoutGrid, exact: false },
  { to: "/new", label: "Add", icon: Plus, exact: false },
  { to: "/reminders", label: "Remind", icon: BellRing, exact: false },
  { to: "/style-guide", label: "Guide", icon: BookOpen, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-brand"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
