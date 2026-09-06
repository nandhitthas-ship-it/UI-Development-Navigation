import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReminderSettings = {
  enabled: boolean;
  sendTime: string;
  email: string | null;
};

export type DeliveryStatus = {
  /** true only when a verified sender domain is configured for this project */
  configured: boolean;
  reason: "sender_domain_missing" | "ready";
};

/** Reports whether the backend can actually deliver reminder email yet. */
export const getDeliveryStatus = createServerFn({ method: "GET" }).handler(async () => {
  const domain = process.env["REMINDER_SENDER_DOMAIN"];
  const status: DeliveryStatus = domain
    ? { configured: true, reason: "ready" }
    : { configured: false, reason: "sender_domain_missing" };
  return status;
});

export const getReminderSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reminder_settings")
      .select("enabled, send_time, email")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const settings: ReminderSettings = {
      enabled: data?.enabled ?? false,
      sendTime: (data?.send_time ?? "08:00:00").slice(0, 5),
      email: data?.email ?? null,
    };
    return settings;
  });

export const saveReminderSettings = createServerFn({ method: "POST" })
  .inputValidator((input: ReminderSettings) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.sendTime)) throw new Error("Invalid time");
    if (input.enabled) {
      const email = (input.email ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Invalid email address");
    }
    return input;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reminder_settings").upsert(
      {
        user_id: context.userId,
        enabled: data.enabled,
        send_time: `${data.sendTime}:00`,
        email: data.email?.trim() || null,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
