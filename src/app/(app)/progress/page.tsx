import { loadDays } from "@/lib/logs";
import { createClient } from "@/lib/supabase/server";
import { computeTargets } from "@/lib/targets";
import type { Answers } from "@/lib/consultation";
import { Charts, type ChartDay } from "./Charts";

export default async function ProgressPage() {
  const supabase = await createClient();
  const [days, first, latest] = await Promise.all([
    loadDays(supabase, 30),
    supabase.from("consultations").select("answers").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("consultations").select("answers").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const targets = latest.data ? computeTargets(latest.data.answers as Answers) : undefined;
  const startWeight = Number((first.data?.answers as Answers | undefined)?.weight_kg) || null;

  const data: ChartDay[] = days.map((d) => ({
    day: d.day,
    calories: d.foods.length ? d.calories : null,
    protein: d.foods.length ? d.protein_g : null,
    weight: d.checkin?.weight_kg != null ? Number(d.checkin.weight_kg) : null,
    stress: d.checkin?.stress ?? null,
    skin: d.checkin?.skin ?? null,
    sleep: d.checkin?.sleep_hours != null ? Number(d.checkin.sleep_hours) : null,
    hips: d.checkin?.hips_cm != null ? Number(d.checkin.hips_cm) : null,
    chest: d.checkin?.chest_cm != null ? Number(d.checkin.chest_cm) : null,
    arm: d.checkin?.arm_cm != null ? Number(d.checkin.arm_cm) : null,
  }));

  const logged = data.filter((d) => d.calories !== null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const last7 = logged.slice(-7);
  const weights = data.filter((d) => d.weight !== null);
  const latestWeight = weights.at(-1)?.weight ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-rose-900">Progress</h1>
      <section className="grid grid-cols-2 gap-3">
        <Stat label="Weight now" value={latestWeight ? `${latestWeight} kg` : "–"} sub={startWeight && latestWeight ? `${latestWeight - startWeight >= 0 ? "+" : ""}${(latestWeight - startWeight).toFixed(1)} kg since start` : "Log it in your check-in"} />
        <Stat label="Avg calories (7 logged days)" value={`${avg(last7.map((d) => d.calories!)) ?? "–"}`} sub={targets ? `target ${targets.calories}` : ""} />
        <Stat label="Avg protein (7 logged days)" value={`${avg(last7.map((d) => d.protein!)) ?? "–"} g`} sub={targets ? `target ${targets.protein_g} g` : ""} />
        <Stat label="Days logged" value={`${logged.length}`} sub="in the last 30" />
      </section>
      <Charts data={data} calorieTarget={targets?.calories ?? null} proteinTarget={targets?.protein_g ?? null} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-semibold text-rose-900">{value}</p>
      <p className="text-xs text-stone-500">{sub}</p>
    </div>
  );
}
