import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/Screen";
import { useTasks } from "@/lib/tasks";
import {
  getDeliveryStatus,
  getReminderSettings,
  saveReminderSettings,
} from "@/lib/reminders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Daily reminder — Tapkeep To-Do" },
      {
        name: "description",
        content: "Get a daily summary of the tasks you planned for the day.",
      },
      { property: "og:title", content: "Daily reminder — Tapkeep To-Do" },
      {
        property: "og:description",
        content: "Get a daily summary of the tasks you planned for the day.",
      },
    ],
  }),
  component: RemindersScreen,
});

function RemindersScreen() {
  const { signedIn } = useTasks();
  const fetchSettings = useServerFn(getReminderSettings);
  const fetchStatus = useServerFn(getDeliveryStatus);
  const save = useServerFn(saveReminderSettings);

  const status = useQuery({ queryKey: ["delivery-status"], queryFn: () => fetchStatus({}) });
  const settings = useQuery({
    queryKey: ["reminder-settings"],
    queryFn: () => fetchSettings({}),
    enabled: signedIn,
  });

  const [enabled, setEnabled] = React.useState(false);
  const [time, setTime] = React.useState("08:00");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (settings.data && !loaded) {
      setEnabled(settings.data.enabled);
      setTime(settings.data.sendTime);
      setEmail(settings.data.email ?? "");
      setLoaded(true);
    }
  }, [settings.data, loaded]);

  if (!signedIn) {
    return (
      <Screen title="Daily reminder" subtitle="Sign in to set up your daily summary.">
        <Link
          to="/auth"
          className="grid h-13 w-full place-items-center rounded-2xl bg-brand text-base font-bold text-primary-foreground shadow-card"
        >
          Sign in
        </Link>
      </Screen>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await save({ data: { enabled, sendTime: time, email: email.trim() || null } });
      toast.success("Reminder settings saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const configured = status.data?.configured === true;

  return (
    <Screen title="Daily reminder" subtitle="A summary of the day's tasks, sent to you.">
      <div
        className={cn(
          "mb-6 flex gap-3 rounded-3xl border p-4",
          configured ? "border-border bg-card" : "border-brand/40 bg-brand-soft",
        )}
      >
        {configured ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
        ) : (
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-brand" />
        )}
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-foreground">
            {configured ? "Sending is switched on" : "Sending isn't set up yet"}
          </p>
          <p className="mt-1 text-sm text-brand-ink">
            {configured
              ? "Reminders go out at your chosen time each day."
              : "Your preferences are saved and the daily schedule is ready, but no reminders will be sent until an email sender address is verified for this app. Nothing is sent in the meantime."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-border bg-card p-4">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-foreground">Daily summary</p>
            <p className="mt-1 text-sm text-muted-foreground">Send me today's tasks</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Daily summary"
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              "h-7 w-12 shrink-0 rounded-full p-1 transition-colors",
              enabled ? "bg-brand" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "block size-5 rounded-full bg-card transition-transform",
                enabled && "translate-x-5",
              )}
            />
          </button>
        </div>

        <div>
          <label htmlFor="time" className="text-sm font-semibold text-foreground">
            Send at
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-2 h-13 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground outline-none focus:border-brand"
          />
        </div>

        <div>
          <label htmlFor="reminder-email" className="text-sm font-semibold text-foreground">
            Send to
          </label>
          <input
            id="reminder-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={!!error}
            className={cn(
              "mt-2 h-13 w-full rounded-2xl border bg-card px-4 text-base text-foreground outline-none focus:border-brand",
              error ? "border-destructive" : "border-border",
            )}
          />
          {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "h-13 w-full rounded-2xl bg-brand text-base font-bold text-primary-foreground shadow-card",
            busy && "opacity-60",
          )}
        >
          Save reminder settings
        </button>
      </form>
    </Screen>
  );
}
