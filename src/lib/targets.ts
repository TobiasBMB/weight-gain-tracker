import type { Answers } from "./consultation";

export type Targets = {
  bmi: number;
  bmr: number;
  maintenance: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  surplus: number;
  weekly_gain_kg: string;
  goal_weight_kg: number | null;
};

const num = (v: Answers[string]) => (typeof v === "number" ? v : v ? Number(v) : NaN);

const JOB_FACTOR: Record<string, number> = {
  Sitting: 1.2,
  "A mix of sitting and moving": 1.3,
  "On my feet most of the day": 1.45,
};

const WALK_FACTOR: Record<string, number> = {
  "Under 15 min": 0,
  "15–30 min": 0.04,
  "30–60 min": 0.08,
  "Over an hour": 0.13,
};

const round = (n: number, to: number) => Math.round(n / to) * to;

/**
 * Daily targets for slow, mostly-lean weight gain.
 * BMR uses Mifflin-St Jeor; activity is estimated from job, gym days and walking.
 * Surplus is ~350 kcal (smaller if appetite is very low, so the target feels doable),
 * protein 1.8 g/kg, fat ~30% of calories, the rest carbs.
 */
export function computeTargets(a: Answers): Targets {
  const age = num(a.age);
  const height = num(a.height_cm);
  const weight = num(a.weight_kg);
  const female = a.sex !== "Male";

  const bmr = 10 * weight + 6.25 * height - 5 * age + (female ? -161 : 5);

  const gymDays = a.gym_days === "5+" ? 5 : num(a.gym_days) || 0;
  const factor = Math.min(
    1.9,
    (JOB_FACTOR[String(a.job_activity)] ?? 1.3) + gymDays * 0.04 + (WALK_FACTOR[String(a.walk_minutes)] ?? 0.04),
  );
  const maintenance = bmr * factor;

  const appetite = num(a.appetite);
  const surplus = appetite && appetite <= 2 ? 250 : 350;
  const calories = round(maintenance + surplus, 50);

  const protein_g = round(weight * 1.8, 5);
  const fat_g = round((calories * 0.3) / 9, 5);
  const carbs_g = round((calories - protein_g * 4 - fat_g * 9) / 4, 5);

  const goal = num(a.goal_weight_kg);

  return {
    bmi: Math.round((weight / (height / 100) ** 2) * 10) / 10,
    bmr: Math.round(bmr),
    maintenance: round(maintenance, 50),
    calories,
    protein_g,
    fat_g,
    carbs_g,
    surplus,
    weekly_gain_kg: "0.25–0.5",
    goal_weight_kg: Number.isFinite(goal) ? goal : null,
  };
}
