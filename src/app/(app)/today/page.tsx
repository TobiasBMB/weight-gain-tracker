import Link from "next/link";
import { InstallTip } from "@/components/InstallTip";
import { addDays, dayKey, formatDay, formatTime, startOfDay } from "@/lib/dates";
import type { ActivityLog, Checkin, FoodLog } from "@/lib/logs";
import { createClient } from "@/lib/supabase/server";
import { computeTargets } from "@/lib/targets";
import type { Answers } from "@/lib/consultation";
import { ActivityForm, CheckinForm, DeleteButton, FoodForm } from "./forms";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const params = await searchParams;
  const today = dayKey();
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) && params.day <= today ? params.day : today;
  const from = startOfDay(day).toISOString();
  const to = startOfDay(addDays(day, 1)).toISOString();

  const supabase = await createClient();
  const [food, activity, checkin, consultation] = await Promise.all([
    supabase.from("food_logs").select("id, eaten_at, meal, description, calories, protein_g, carbs_g, fat_g").gte("eaten_at", from).lt("eaten_at", to).order("eaten_at"),
    supabase.from("activity_logs").select("id, done_at, kind, description, minutes, intensity").gte("done_at", from).lt("done_at", to).order("done_at"),
    supabase.from("checkins").select("*").eq("day", day).maybeSingle(),
    supabase.from("consultations").select("answers").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const foods = (food.data ?? []) as FoodLog[];
  const activities = (activity.data ?? []) as ActivityLog[];
  const targets = consultation.data ? computeTargets(consultation.data.answers as Answers) : undefined;
  const calories = foods.reduce((s, f) => s + (f.calories ?? 0), 0);
  const protein = Math.round(foods.reduce((s, f) => s + Number(f.protein_g ?? 0), 0));

  return (
    <div className="space-y-4">
      <InstallTip />
      <div className="flex items-center justify-between">
        <Link href={`/today?day=${addDays(day, -1)}`} className="px-2 py-1 text-rose-800" aria-label="Previous day">
          ←
        </Link>
        <h1 className="text-lg font-semibold">{day === today ? "Today" : formatDay(day)}</h1>
        {day < today ? (
          <Link href={`/today?day=${addDays(day, 1)}`} className="px-2 py-1 text-rose-800" aria-label="Next day">
            →
          </Link>
        ) : (
          <span className="w-8" />
        )}
      </div>

      <section className="card space-y-3">
        <Bar label="Calories" value={calories} target={targets?.calories} unit="kcal" />
        <Bar label="Protein" value={protein} target={targets?.protein_g} unit="g" />
        {!targets && (
          <p className="text-sm text-stone-600">
            <Link href="/consultation" className="text-rose-800 underline">
              Do your consultation
            </Link>{" "}
            to get daily targets.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Food and drink</h2>
        {foods.length > 0 && (
          <ul className="mb-4 divide-y divide-rose-50">
            {foods.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <p className="text-sm text-stone-500">
                    {formatTime(f.eaten_at)} · <span className="capitalize">{f.meal}</span>
                  </p>
                  <p className="text-stone-900">{f.description}</p>
                  <p className="text-sm text-stone-500">
                    {f.calories ?? "?"} kcal · {f.protein_g ?? "?"} g protein
                  </p>
                </div>
                <DeleteButton table="food_logs" id={f.id} />
              </li>
            ))}
          </ul>
        )}
        <FoodForm day={day} />
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Exercise and activity</h2>
        {activities.length > 0 && (
          <ul className="mb-4 divide-y divide-rose-50">
            {activities.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <p className="text-stone-900">
                    <span className="capitalize">{a.kind}</span> · {a.minutes} min · {a.intensity}
                  </p>
                  {a.description && <p className="text-sm text-stone-600">{a.description}</p>}
                </div>
                <DeleteButton table="activity_logs" id={a.id} />
              </li>
            ))}
          </ul>
        )}
        <ActivityForm day={day} />
      </section>

      <section className="card">
        <h2 className="mb-1 font-semibold">Daily check-in</h2>
        <p className="mb-3 text-sm text-stone-600">Takes 20 seconds. Weigh yourself once a week, same time of day.</p>
        <CheckinForm key={day} day={day} initial={(checkin.data as Checkin | null) ?? null} />
      </section>
    </div>
  );
}

function Bar({ label, value, target, unit }: { label: string; value: number; target?: number; unit: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-stone-800">{label}</span>
        <span className="text-stone-600">
          {value}
          {target ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-rose-100">
        <div className={`h-full rounded-full ${pct >= 90 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
