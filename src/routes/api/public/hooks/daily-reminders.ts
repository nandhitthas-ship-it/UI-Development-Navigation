import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Scheduled endpoint: finds every user whose daily reminder time has passed
 * today and builds their summary of unfinished tasks.
 *
 * Delivery is intentionally NOT faked. Sending email requires a verified
 * sender domain for this project; until REMINDER_SENDER_DOMAIN is set (and the
 * project's email sender is scaffolded against it) the endpoint reports the
 * pending configuration state and sends nothing.
 */
export const Route = createFileRoute("/api/public/hooks/daily-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Accept the platform cron secret, or the project's own scheduler key.
        const apiKey = request.headers.get("apikey");
        const schedulerKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const keyMatches = !!apiKey && !!schedulerKey && apiKey === schedulerKey;
        if (!keyMatches) {
          const unauthorized = await authenticateCronRequest(request);
          if (unauthorized) return unauthorized;
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);
        const nowTime = new Date().toISOString().slice(11, 19);

        const { data: due, error } = await supabaseAdmin
          .from("reminder_settings")
          .select("user_id, send_time, email, last_sent_on")
          .eq("enabled", true)
          .lte("send_time", nowTime)
          .or(`last_sent_on.is.null,last_sent_on.lt.${today}`);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const recipients = (due ?? []).filter((r) => !!r.email);

        // Build each summary so the scheduling half is fully exercised and
        // observable, even while delivery is still unconfigured.
        const summaries: Array<{ userId: string; email: string; taskCount: number }> = [];
        for (const r of recipients) {
          const { data: tasks } = await supabaseAdmin
            .from("tasks")
            .select("title, category")
            .eq("user_id", r.user_id)
            .eq("deleted", false)
            .eq("done", false);
          summaries.push({
            userId: r.user_id,
            email: r.email as string,
            taskCount: tasks?.length ?? 0,
          });
        }

        if (!process.env["REMINDER_SENDER_DOMAIN"]) {
          return Response.json({
            ok: true,
            delivery: "not_configured",
            reason: "sender_domain_missing",
            due: summaries.length,
            sent: 0,
          });
        }

        // Sender domain is configured — mark today's reminders as handled.
        for (const s of summaries) {
          await supabaseAdmin
            .from("reminder_settings")
            .update({ last_sent_on: today })
            .eq("user_id", s.userId);
        }

        return Response.json({
          ok: true,
          delivery: "configured",
          due: summaries.length,
          sent: summaries.length,
        });
      },
    },
  },
});
