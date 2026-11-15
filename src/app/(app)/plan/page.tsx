import Link from "next/link";
import { CardTitle, Icon, type IconName } from "@/components/Icon";
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
      <section className="card space-y-3">
        <h1 className="text-xl font-bold">No plan yet</h1>
        <p className="text-soft">Start with the consultation so the plan fits you.</p>
        <Link href="/consultation" className="btn-primary">
          Start consultation
        </Link>
      </section>
    );
  }

  if (!row) {
    return (
      <section className="card space-y-3">
        <h1 className="text-xl font-bold">Your plan</h1>
        <p className="text-soft">Your consultation is saved. Create your personal plan now.</p>
        <RegenerateButton label="Create my plan" primary />
      </section>
    );
  }

  const plan = row.plan as Plan;
  const t = row.targets as Targets;
  const outdated = row.consultation_id !== consultation.id;
  const dayKcal = Math.round(plan.daily_plan.reduce((s, m) => s + m.calories, 0));
  const dayProtein = Math.round(plan.daily_plan.reduce((s, m) => s + m.protein_g, 0));

  return (
    <div className="space-y-3.5">
      <div className="flex items-baseline justify-between px-1">
        <h1 className="text-2xl font-extrabold tracking-tight">My plan</h1>
        <span className="text-[13px] text-muted">
          Updated {new Date(row.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        </span>
      </div>

      <section className="card space-y-2">
        <span className="eyebrow">This week, focus on</span>
        <p className="text-lg font-bold leading-snug">{plan.this_week_focus}</p>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <Tile value={t.calories.toLocaleString("en-AU")} label="Calories a day" className="text-baby" />
        <Tile value={`${t.protein_g} g`} label="Protein a day" className="text-blush" />
        <Tile value={`${t.bmi}`} label="BMI (healthy 18.5+)" />
        <Tile value={t.goal_weight_kg ? `${t.goal_weight_kg} kg` : `${t.weekly_gain_kg}`} label={t.goal_weight_kg ? `Goal, ${t.weekly_gain_kg} kg a week` : "kg to gain a week"} />
      </div>

      <section className="card">
        <p className="leading-relaxed text-soft">{plan.summary}</p>
        {plan.progress_notes && <p className="mt-3 leading-relaxed text-soft">{plan.progress_notes}</p>}
      </section>

      {plan.check_with_doctor.length > 0 && (
        <section className="flex gap-3 rounded-[20px] border border-blush bg-card p-4">
          <Icon name="heart" size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-blush" />
          <div>
            <h2 className="text-[15px] font-bold">Worth a chat with your GP</h2>
            <ul className="mt-1 space-y-1 text-sm leading-relaxed text-soft">
              {plan.check_with_doctor.map((d, i) => (
                <li key={i}>
                  {d.urgency === "soon" && <span className="font-semibold text-blush">Soon: </span>}
                  {d.reason}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="card">
        <CardTitle icon="calendar" action={<span className="text-[13px] text-muted">≈ {dayKcal.toLocaleString("en-AU")} kcal · {dayProtein} g</span>}>
          A sample day
        </CardTitle>
        <ul className="space-y-2">
          {plan.daily_plan.map((m, i) => (
            <li key={i} className="row flex gap-3.5">
              <span className="w-[62px] shrink-0 text-sm font-bold">{m.time}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">{m.foods}</p>
                <p className="text-[13px] text-muted">
                  {m.meal} · {Math.round(m.calories)} kcal · <span className="text-blush">{Math.round(m.protein_g)} g protein</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ListCard icon="spark" title="Easy wins" items={plan.easy_wins} />

      {plan.swaps.length > 0 && (
        <section className="card">
          <CardTitle icon="next">Simple swaps</CardTitle>
          <ul className="space-y-2">
            {plan.swaps.map((s, i) => (
              <li key={i} className="row">
                <p className="text-[15px]">
                  <span className="text-muted line-through">{s.instead_of}</span> → <span className="font-semibold">{s.try}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{s.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.supplements.length > 0 && (
        <section className="card">
          <CardTitle icon="pill">Supplements</CardTitle>
          <ul className="space-y-2">
            {plan.supplements.map((s, i) => (
              <li key={i} className="row space-y-0.5">
                <p className="text-[15px] font-semibold">{s.name}</p>
                <p className="text-[13px] text-baby">
                  {s.dose} · {s.timing}
                </p>
                <p className="text-sm text-soft">{s.why}</p>
                {s.caution && <p className="text-[13px] text-blush">{s.caution}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ListCard icon="run" title="Training" items={plan.training} />
      <ListCard icon="heart" title="Skin and stress" items={plan.skin_and_stress} />
      <ListCard icon="pulse" title="What's likely behind the weight loss" items={plan.likely_factors} />
      <ListCard icon="cart" title="Shopping list" items={plan.grocery_list} />

      <section className="card space-y-3">
        <p className="text-sm text-muted">
          {outdated
            ? "You've updated your consultation since this plan was written."
            : "Refresh after a week or two of logging so the plan can learn from what you actually eat."}
        </p>
        <RegenerateButton label={outdated ? "Update my plan" : "Refresh my plan"} primary={outdated} />
      </section>

      <p className="px-1 text-xs leading-relaxed text-muted">
        General guidance only, not medical advice. Check with your GP or pharmacist before starting supplements, especially if
        you take medication or could be pregnant.
      </p>
    </div>
  );
}

function Tile({ value, label, className = "" }: { value: string; label: string; className?: string }) {
  return (
    <div className="tile">
      <p className={`text-[28px] font-extrabold leading-tight ${className}`}>{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function ListCard({ icon, title, items }: { icon: IconName; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="card">
      <CardTitle icon={icon}>{title}</CardTitle>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-soft">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-baby" aria-hidden="true" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
