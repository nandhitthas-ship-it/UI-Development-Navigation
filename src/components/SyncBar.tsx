import { Link } from "@tanstack/react-router";
import { CloudOff, RefreshCw, CloudCheck, TriangleAlert } from "lucide-react";
import { useTasks } from "@/lib/tasks";

export function SyncBar() {
  const { syncState, pendingCount, syncNow } = useTasks();

  if (syncState === "signed-out") {
    return (
      <Link
        to="/auth"
        className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground"
      >
        <CloudOff className="size-4 shrink-0 text-brand" />
        <span className="min-w-0 truncate">Saved on this device — sign in to sync</span>
      </Link>
    );
  }

  const map = {
    offline: {
      icon: <CloudOff className="size-4 shrink-0 text-brand" />,
      text:
        pendingCount > 0
          ? `Offline — ${pendingCount} change${pendingCount === 1 ? "" : "s"} waiting to sync`
          : "Offline — changes are saved on this device",
    },
    pending: {
      icon: <RefreshCw className="size-4 shrink-0 animate-spin text-brand" />,
      text: "Syncing your changes…",
    },
    synced: {
      icon: <CloudCheck className="size-4 shrink-0 text-brand" />,
      text: "All changes saved and synced",
    },
    error: {
      icon: <TriangleAlert className="size-4 shrink-0 text-destructive" />,
      text: "Couldn't sync — tap to retry",
    },
  } as const;

  const state = map[syncState];

  return (
    <button
      type="button"
      onClick={syncNow}
      className="mb-4 flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-muted-foreground"
    >
      {state.icon}
      <span className="min-w-0 truncate">{state.text}</span>
    </button>
  );
}
