"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReminderSettings = {
  time_zone: string;
  meal_nudges: boolean;
  meal_times: string[];
  checkin: boolean;
  checkin_time: string;
  weigh_in: boolean;
  weigh_in_day: number;
  weigh_in_time: string;
  weekly_summary: boolean;
  summary_day: number;
  summary_time: string;
};

const isTime = (s: unknown): s is string => typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
const isDay = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6;

export async function saveSubscription(sub: { endpoint: string; p256dh: string; auth: string; userAgent: string }) {
  if (!sub.endpoint.startsWith("https://") || sub.endpoint.length > 2000 || !sub.p256dh || !sub.auth) {
    return { error: "Invalid subscription." };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  // Replace any earlier subscription for this endpoint (same device re-subscribing).
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    user_agent: sub.userAgent.slice(0, 500),
  });
  if (error) return { error: "Couldn't save this device. Try again." };

  // Make sure there are settings so reminders start with the defaults.
  await supabase.from("reminder_settings").upsert({ user_id: auth.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  revalidatePath("/reminders");
  return {};
}

export async function removeSubscription(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  revalidatePath("/reminders");
}

export async function saveSettings(s: ReminderSettings): Promise<{ error?: string }> {
  const times = s.meal_times.filter(isTime).slice(0, 6);
  if (
    ![s.checkin_time, s.weigh_in_time, s.summary_time].every(isTime) ||
    !isDay(s.weigh_in_day) ||
    !isDay(s.summary_day) ||
    typeof s.time_zone !== "string" ||
    s.time_zone.length > 64
  ) {
    return { error: "Check the times." };
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: s.time_zone });
  } catch {
    return { error: "Unknown time zone." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  const { error } = await supabase.from("reminder_settings").upsert(
    {
      user_id: auth.user.id,
      time_zone: s.time_zone,
      meal_nudges: Boolean(s.meal_nudges),
      meal_times: times,
      checkin: Boolean(s.checkin),
      checkin_time: s.checkin_time,
      weigh_in: Boolean(s.weigh_in),
      weigh_in_day: s.weigh_in_day,
      weigh_in_time: s.weigh_in_time,
      weekly_summary: Boolean(s.weekly_summary),
      summary_day: s.summary_day,
      summary_time: s.summary_time,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "Couldn't save. Try again." };
  revalidatePath("/reminders");
  return {};
}
