"use server";

import { revalidatePath } from "next/cache";
import { localDateTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

const MEALS = ["breakfast", "lunch", "dinner", "snack", "drink"];
const KINDS = ["gym", "walk", "cardio", "sport", "yoga", "other"];
const INTENSITIES = ["light", "moderate", "hard"];

export type ActionResult = { error?: string };

const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s: string) => /^\d{2}:\d{2}$/.test(s);

function optionalNumber(v: FormDataEntryValue | null, min: number, max: number) {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export async function addFood(_: ActionResult, form: FormData): Promise<ActionResult> {
  const day = String(form.get("day"));
  const time = String(form.get("time"));
  const meal = String(form.get("meal"));
  const description = String(form.get("description") ?? "").trim();
  const calories = optionalNumber(form.get("calories"), 0, 10000);
  const protein_g = optionalNumber(form.get("protein_g"), 0, 1000);
  const carbs_g = optionalNumber(form.get("carbs_g"), 0, 2000);
  const fat_g = optionalNumber(form.get("fat_g"), 0, 1000);

  if (!isDay(day) || !isTime(time) || !MEALS.includes(meal)) return { error: "Check the meal and time." };
  if (!description || description.length > 1000) return { error: "Describe what you had." };
  if (calories === undefined || protein_g === undefined || carbs_g === undefined || fat_g === undefined) {
    return { error: "Check the numbers." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("food_logs").insert({
    eaten_at: localDateTime(day, time).toISOString(),
    meal,
    description,
    calories: calories === null ? null : Math.round(calories),
    protein_g,
    carbs_g,
    fat_g,
  });
  if (error) return { error: "Couldn't save. Try again." };
  revalidatePath("/today");
  return {};
}

export async function addActivity(_: ActionResult, form: FormData): Promise<ActionResult> {
  const day = String(form.get("day"));
  const time = String(form.get("time"));
  const kind = String(form.get("kind"));
  const intensity = String(form.get("intensity"));
  const minutes = optionalNumber(form.get("minutes"), 1, 1440);
  const description = String(form.get("description") ?? "").trim().slice(0, 1000) || null;

  if (!isDay(day) || !isTime(time) || !KINDS.includes(kind) || !INTENSITIES.includes(intensity) || !minutes) {
    return { error: "Check the activity details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("activity_logs").insert({
    done_at: localDateTime(day, time).toISOString(),
    kind,
    intensity,
    minutes: Math.round(minutes),
    description,
  });
  if (error) return { error: "Couldn't save. Try again." };
  revalidatePath("/today");
  return {};
}

export async function saveCheckin(_: ActionResult, form: FormData): Promise<ActionResult> {
  const day = String(form.get("day"));
  if (!isDay(day)) return { error: "Invalid day." };

  const fields = {
    weight_kg: optionalNumber(form.get("weight_kg"), 20, 300),
    sleep_hours: optionalNumber(form.get("sleep_hours"), 0, 24),
    sleep_quality: optionalNumber(form.get("sleep_quality"), 1, 5),
    stress: optionalNumber(form.get("stress"), 1, 5),
    skin: optionalNumber(form.get("skin"), 1, 5),
    appetite: optionalNumber(form.get("appetite"), 1, 5),
    energy: optionalNumber(form.get("energy"), 1, 5),
    hips_cm: optionalNumber(form.get("hips_cm"), 30, 250),
    chest_cm: optionalNumber(form.get("chest_cm"), 30, 250),
    arm_cm: optionalNumber(form.get("arm_cm"), 10, 100),
    waist_cm: optionalNumber(form.get("waist_cm"), 30, 250),
  };
  if (Object.values(fields).includes(undefined)) return { error: "Check the numbers." };
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000) || null;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("checkins")
    .upsert({ user_id: auth.user.id, day, ...fields, notes }, { onConflict: "user_id,day" });
  if (error) return { error: "Couldn't save. Try again." };
  revalidatePath("/today");
  revalidatePath("/progress");
  return {};
}

export async function deleteEntry(table: "food_logs" | "activity_logs", id: string) {
  if (!["food_logs", "activity_logs"].includes(table)) return;
  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath("/today");
}
