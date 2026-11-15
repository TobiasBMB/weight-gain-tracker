import { TIME_ZONE } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { ReminderSettings } from "./actions";
import { Reminders } from "./Reminders";

const DEFAULTS: ReminderSettings = {
  time_zone: TIME_ZONE,
  meal_nudges: true,
  meal_times: ["10:30", "15:00"],
  checkin: true,
  checkin_time: "20:00",
  weigh_in: true,
  weigh_in_day: 1,
  weigh_in_time: "07:30",
  weekly_summary: true,
  summary_day: 0,
  summary_time: "18:00",
};

const hhmm = (t: string) => t.slice(0, 5);

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("reminder_settings").select("*").maybeSingle();
  const settings: ReminderSettings = data
    ? {
        time_zone: data.time_zone,
        meal_nudges: data.meal_nudges,
        meal_times: (data.meal_times as string[]).map(hhmm),
        checkin: data.checkin,
        checkin_time: hhmm(data.checkin_time),
        weigh_in: data.weigh_in,
        weigh_in_day: data.weigh_in_day,
        weigh_in_time: hhmm(data.weigh_in_time),
        weekly_summary: data.weekly_summary,
        summary_day: data.summary_day,
        summary_time: hhmm(data.summary_time),
      }
    : DEFAULTS;

  return <Reminders initial={settings} />;
}
