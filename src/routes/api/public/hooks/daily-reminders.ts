import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Scheduled endpoint: picks up every user whose reminder time has passed today
 * and prepares their daily task summary.
 *
 * Delivery is intentionally NOT faked: until a verified sender domain is
 * configured (REMINDER_SENDER_DOMAIN), the endpoint reports the pending
 * configuration state instead of pretending mail went out.
 */
export const Route = createFileRoute("/api/public/hooks/daily-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;

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

        const senderDomain = process.env["REMINDER_SENDER_DOMAIN"];
        const recipients = due ?? [];

        if (!senderDomain) {
          return Response.json({
            ok: true,
            delivery: "not_configured",
            reason: "sender_domain_missing",
            due: recipients.length,
            sent: 0,
          });
        }

        // Sender domain is configured: build each summary and hand it to the
        // project's email sender. The sender module is scaffolded as part of
        // email setup, so it is resolved at runtime rather than imported.
        let sent = 0;
        const sender = (await import(
          /* @vite-ignore */ "@/lib/email-templates/send-email"
        ).catch(() => null)) as {
          sendTemplateEmail?: (
            template: string,
            to: string,
            options: { templateData: unknown; idempotencyKey: string },
          ) => Promise<unknown>;
        } | null;

        if (!sender?.sendTemplateEmail) {
          return Response.json({
            ok: true,
            delivery: "not_configured",
            reason: "email_sender_not_scaffolded",
            due: recipients.length,
            sent: 0,
          });
        }

        for (const r of recipients) {
          if (!r.email) continue;
          const { data: tasks } = await supabaseAdmin
            .from("tasks")
            .select("title, category")
            .eq("user_id", r.user_id)
            .eq("deleted", false)
            .eq("done", false);

          await sender.sendTemplateEmail("daily-reminder", r.email, {
            templateData: { tasks: tasks ?? [] },
            idempotencyKey: `daily-reminder-${r.user_id}-${today}`,
          });
          await supabaseAdmin
            .from("reminder_settings")
            .update({ last_sent_on: today })
            .eq("user_id", r.user_id);
          sent += 1;
        }

        return Response.json({ ok: true, delivery: "configured", due: recipients.length, sent });
      },
    },
  },
});
