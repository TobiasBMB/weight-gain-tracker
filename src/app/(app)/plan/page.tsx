import Link from "next/link";
import { RegenerateButton } from "@/components/RegenerateButton";
import type { Plan } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { Targets } from "@/lib/targets";

export default async function PlanPage() {
  const supabase = await createClient();
  const [{ data: row }, { data: consultation }] = await Promise.all([
    supabase.from("plans").select("targets, plan, created_at, consultation_id").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("consultations").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!consultation) {
    return (
      <div className="card space-y-3">
        <h1 className="text-xl font-semibold text-rose-900">No plan yet</h1>
        <p className="text-stone-700">Start with the consultation so the plan fits you.</p>
        <Link href="/consultation" className="btn-primary block text-center">
          Start consultation
        </Link>
      </div>
    );
  }

  if (!row) return <div className="card"><RegenerateButton label="Create my plan" /></div>;

  const plan = row.plan as Plan;
  const t = row.targets as Targets;
  const outdated = row.consultation_id !== consultation.id;

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="text-2xl font-semibold text-rose-900">Your plan</h1>
        <p className="mt-1 text-xs text-stone-500">
          Updated {new Date(row.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </p>
        <p className="mt-3 text-stone-800">{plan.summary}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Calories a day" value={`${t.calories}`} sub={`maintenance ≈ ${t.maintenance}`} />
        <Stat label="Protein a day" value={`${t.protein_g} g`} sub={`fat ${t.fat_g} g · carbs ${t.carbs_g} g`} />
        <Stat label="BMI now" value={`${t.bmi}`} sub="healthy is 18.5–25" />
        <Stat label="Aim to gain" value={`${t.weekly_gain_kg} kg`} sub={t.goal_weight_kg ? `a week, to ${t.goal_weight_kg} kg` : "a week"} />
      </section>

      <Card title="This week, focus on">
        <p className="font-medium text-rose-900">{plan.this_week_focus}</p>
      </Card>

      {plan.progress_notes && (
        <Card title="How you're tracking">
          <p className="text-stone-800">{plan.progress_notes}</p>
        </Card>
      )}

      {plan.check_with_doctor.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">Worth a chat with your GP</h2>
          <ul className="mt-2 space-y-1.5 text-amber-950">
            {plan.check_with_doctor.map((d, i) => (
              <li key={i}>
                {d.urgency === "soon" && <span className="mr-1 font-semibold">Soon:</span>}
                {d.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card title="A sample day">
        <ol className="divide-y divide-rose-50">
          {plan.daily_plan.map((m, i) => (
            <li key={i} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-stone-900">
                  {m.time} · {m.meal}
                </span>
                <span className="shrink-0 text-sm text-stone-500">
                  {Math.round(m.calories)} kcal · {Math.round(m.protein_g)} g
                </span>
              </div>
              <p className="text-stone-700">{m.foods}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-stone-500">
          Total ≈ {Math.round(plan.daily_plan.reduce((s, m) => s + m.calories, 0))} kcal,{" "}
          {Math.round(plan.daily_plan.reduce((s, m) => s + m.protein_g, 0))} g protein
        </p>
      </Card>

      <List title="Easy wins" items={plan.easy_wins} />

      {plan.swaps.length > 0 && (
        <Card title="Simple swaps">
          <ul className="space-y-2.5">
            {plan.swaps.map((s, i) => (
              <li key={i}>
                <p className="text-stone-900">
                  <span className="text-stone-500 line-through">{s.instead_of}</span> → <span className="font-medium">{s.try}</span>
                </p>
                <p className="text-sm text-stone-600">{s.why}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {plan.supplements.length > 0 && (
        <Card title="Supplements">
          <ul className="space-y-3">
            {plan.supplements.map((s, i) => (
              <li key={i}>
                <p className="font-medium text-stone-900">{s.name}</p>
                <p className="text-sm text-stone-700">
                  {s.dose} · {s.timing}
                </p>
                <p className="text-sm text-stone-700">{s.why}</p>
                {s.caution && <p className="text-sm text-amber-800">{s.caution}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <List title="Training" items={plan.training} />
      <List title="Skin and stress" items={plan.skin_and_stress} />
      <List title="What's likely behind the weight loss" items={plan.likely_factors} />
      <List title="Shopping list" items={plan.grocery_list} />

      <section className="card space-y-3">
        <p className="text-sm text-stone-600">
          {outdated
            ? "You've updated your consultation since this plan was written."
            : "Refresh after a week or two of logging so the plan can learn from what you actually eat."}
        </p>
        <RegenerateButton label={outdated ? "Update my plan" : "Refresh my plan"} />
      </section>

      <p className="px-1 text-xs text-stone-500">
        General guidance only, not medical advice. Check with your GP or pharmacist before starting supplements, especially
        if you take medication or could be pregnant.
      </p>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-2 font-semibold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <Card title={title}>
      <ul className="list-disc space-y-1.5 pl-5 text-stone-800">
        {items.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </Card>
  );
}
