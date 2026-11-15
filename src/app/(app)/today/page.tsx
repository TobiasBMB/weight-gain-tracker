import Link from "next/link";
import { CardTitle, Icon } from "@/components/Icon";
import { InstallTip } from "@/components/InstallTip";
import type { Answers } from "@/lib/consultation";
import { addDays, dayKey, formatTime, startOfDay, TIME_ZONE } from "@/lib/dates";
import type { ActivityLog, Checkin, FoodLog } from "@/lib/logs";
import { createClient } from "@/lib/supabase/server";
import { computeTargets } from "@/lib/targets";
import { ActivityForm, CheckinForm, DeleteButton } from "./forms";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (h < 12) return { text: "Good morning", icon: "sun" as const };
  if (h < 17) return { text: "Good afternoon", icon: "sun" as const };
  return { text: "Good evening", icon: "moon" as const };
}

const longDay = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T00:00:00Z`));

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
  const answers = consultation.data?.answers as Answers | undefined;
  const targets = answers ? computeTargets(answers) : undefined;
  const name = typeof answers?.preferred_name === "string" ? answers.preferred_name.trim().slice(0, 40) : "";
  const calories = foods.reduce((s, f) => s + (f.calories ?? 0), 0);
  const protein = Math.round(foods.reduce((s, f) => s + Number(f.protein_g ?? 0), 0));
  const isToday = day === today;
  const hello = greeting();

  return (
    <div className="space-y-3.5">
      <InstallTip />

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Icon name={hello.icon} size={16} className="text-baby" />
            {isToday ? `${hello.text} · ` : ""}
            {longDay(day)}
          </div>
          <div className="-mr-2 flex">
            <Link href={`/today?day=${addDays(day, -1)}`} aria-label="Previous day" className="flex h-9 w-9 items-center justify-center rounded-lg text-soft hover:bg-raised">
              <Icon name="back" size={18} />
            </Link>
            {!isToday && (
              <Link href={`/today?day=${addDays(day, 1)}`} aria-label="Next day" className="flex h-9 w-9 items-center justify-center rounded-lg text-soft hover:bg-raised">
                <Icon name="next" size={18} />
              </Link>
            )}
          </div>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{isToday ? name || "Today" : "Looking back"}</h1>
        <div className="flex gap-1" aria-hidden="true">
          <span className="h-1 w-7 rounded-full bg-baby" />
          <span className="h-1 w-7 rounded-full bg-blush" />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line px-3 py-1.5 text-[13px] text-soft">
            {foods.length} {foods.length === 1 ? "meal" : "meals"} logged
          </span>
          <span className="rounded-full border border-line px-3 py-1.5 text-[13px] text-soft">
            {checkin.data ? "Check-in done" : "Check-in not done"}
          </span>
        </div>
      </section>

      <section className="card">
        <CardTitle icon="pulse">{isToday ? "Today's targets" : "Targets"}</CardTitle>
        {targets ? (
          <div className="space-y-4">
            <Bar label="Calories" value={calories} target={targets.calories} unit="kcal" color="bg-baby" />
            <Bar label="Protein" value={protein} target={targets.protein_g} unit="g" color="bg-blush" />
          </div>
        ) : (
          <p className="text-soft">
            <Link href="/consultation" className="font-semibold text-baby">
              Do your consultation
            </Link>{" "}
            to get daily targets.
          </p>
        )}
      </section>

      <section className="card">
        <CardTitle
          icon="bowl"
          action={
            <Link href={`/log?day=${day}`} className="text-[15px] font-semibold text-baby">
              + Add
            </Link>
          }
        >
          Food
        </CardTitle>
        {foods.length ? (
          <ul className="space-y-2">
            {foods.map((f) => (
              <li key={f.id} className="row flex items-center gap-3.5 py-2 pr-1">
                <span className="w-[62px] shrink-0 text-sm font-bold">{formatTime(f.eaten_at)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{f.description}</p>
                  <p className="text-[13px] text-muted">
                    <span className="capitalize">{f.meal}</span> · {f.calories ?? "?"} kcal ·{" "}
                    <span className="text-blush">{f.protein_g ?? "?"} g protein</span>
                  </p>
                </div>
                <DeleteButton table="food_logs" id={f.id} />
              </li>
            ))}
          </ul>
        ) : (
          <Link href={`/log?day=${day}`} className="btn-outline w-full">
            Log your first meal
          </Link>
        )}
      </section>

      <section className="card">
        <CardTitle icon="run">Exercise</CardTitle>
        {activities.length > 0 && (
          <ul className="mb-3 space-y-2">
            {activities.map((a) => (
              <li key={a.id} className="row flex items-center gap-3 py-2 pr-1">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">
                    <span className="capitalize">{a.kind}</span> · {a.minutes} min
                  </p>
                  <p className="truncate text-[13px] text-muted">
                    <span className="capitalize">{a.intensity}</span>
                    {a.description ? ` · ${a.description}` : ""}
                  </p>
                </div>
                <DeleteButton table="activity_logs" id={a.id} />
              </li>
            ))}
          </ul>
        )}
        <ActivityForm day={day} />
      </section>

      <section className="card">
        <h2 className="text-[19px] font-bold">Daily check-in</h2>
        <p className="mb-3.5 mt-0.5 text-sm text-muted">Takes 20 seconds. Weigh yourself once a week, same time of day.</p>
        <CheckinForm key={day} day={day} initial={(checkin.data as Checkin | null) ?? null} />
      </section>
    </div>
  );
}

function Bar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-soft">{label}</span>
        <span>
          <b>{value.toLocaleString("en-AU")}</b>{" "}
          <span className="text-muted">
            / {target.toLocaleString("en-AU")} {unit}
          </span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line-soft">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
