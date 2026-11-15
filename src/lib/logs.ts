import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, dayKey, formatTime, startOfDay } from "./dates";

export type FoodLog = {
  id: string;
  eaten_at: string;
  meal: string;
  description: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type ActivityLog = {
  id: string;
  done_at: string;
  kind: string;
  description: string | null;
  minutes: number;
  intensity: string;
};

export type Checkin = {
  day: string;
  weight_kg: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress: number | null;
  skin: number | null;
  appetite: number | null;
  energy: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  waist_cm: number | null;
  notes: string | null;
};

export type DaySummary = {
  day: string;
  calories: number;
  protein_g: number;
  foods: FoodLog[];
  activities: ActivityLog[];
  checkin: Checkin | null;
};

/** Food, activity and check-ins for the last `days` days (oldest first), grouped by local day. */
export async function loadDays(supabase: SupabaseClient, days: number): Promise<DaySummary[]> {
  const today = dayKey();
  const first = addDays(today, -(days - 1));
  const from = startOfDay(first).toISOString();

  const [food, activity, checkins] = await Promise.all([
    supabase.from("food_logs").select("id, eaten_at, meal, description, calories, protein_g, carbs_g, fat_g").gte("eaten_at", from).order("eaten_at"),
    supabase.from("activity_logs").select("id, done_at, kind, description, minutes, intensity").gte("done_at", from).order("done_at"),
    supabase.from("checkins").select("*").gte("day", first).order("day"),
  ]);
  for (const r of [food, activity, checkins]) if (r.error) throw r.error;

  const out: DaySummary[] = [];
  for (let i = 0; i < days; i++) {
    const day = addDays(first, i);
    const foods = (food.data as FoodLog[]).filter((f) => dayKey(new Date(f.eaten_at)) === day);
    out.push({
      day,
      foods,
      activities: (activity.data as ActivityLog[]).filter((a) => dayKey(new Date(a.done_at)) === day),
      checkin: (checkins.data as Checkin[]).find((c) => c.day === day) ?? null,
      calories: foods.reduce((s, f) => s + (f.calories ?? 0), 0),
      protein_g: Math.round(foods.reduce((s, f) => s + Number(f.protein_g ?? 0), 0)),
    });
  }
  return out;
}

/** Compact text version of recent days for the AI prompt. Days with nothing logged are skipped. */
export function daysToText(days: DaySummary[]) {
  return days
    .filter((d) => d.foods.length || d.activities.length || d.checkin)
    .map((d) => {
      const lines = [`## ${d.day} (total ${d.calories} kcal, ${d.protein_g} g protein)`];
      for (const f of d.foods) lines.push(`- ${formatTime(f.eaten_at)} ${f.meal}: ${f.description} (${f.calories ?? "?"} kcal, ${f.protein_g ?? "?"} g protein)`);
      for (const a of d.activities) lines.push(`- Activity: ${a.kind}, ${a.minutes} min, ${a.intensity}${a.description ? `, ${a.description}` : ""}`);
      const c = d.checkin;
      if (c) {
        const bits = [
          c.weight_kg && `weight ${c.weight_kg} kg`,
          c.sleep_hours && `slept ${c.sleep_hours} h`,
          c.sleep_quality && `sleep quality ${c.sleep_quality}/5`,
          c.stress && `stress ${c.stress}/5`,
          c.skin && `skin ${c.skin}/5 (5 = clear)`,
          c.appetite && `appetite ${c.appetite}/5`,
          c.energy && `energy ${c.energy}/5`,
          c.notes && `notes: ${c.notes}`,
        ].filter(Boolean);
        if (bits.length) lines.push(`- Check-in: ${bits.join(", ")}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
