import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai";
import { aiErrorResponse, requireAiUser } from "@/lib/api";
import { answersToText, type Answers } from "@/lib/consultation";
import { dayKey, startOfDay } from "@/lib/dates";
import { daysToText, loadDays } from "@/lib/logs";
import { computeTargets } from "@/lib/targets";

export const maxDuration = 300;

const MAX_PLANS_PER_DAY = 10;

export async function POST() {
  const auth = await requireAiUser();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const { count } = await supabase
    .from("plans")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay(dayKey()).toISOString());
  if ((count ?? 0) >= MAX_PLANS_PER_DAY) {
    return NextResponse.json({ error: "That's plenty of plans for today. Try again tomorrow." }, { status: 429 });
  }

  const { data: consultation, error } = await supabase
    .from("consultations")
    .select("id, answers")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return aiErrorResponse(error);
  if (!consultation) return NextResponse.json({ error: "Do the consultation first." }, { status: 400 });

  const answers = consultation.answers as Answers;
  const targets = computeTargets(answers);

  try {
    const days = await loadDays(supabase, 14);
    const plan = await generatePlan({
      consultation: answersToText(answers),
      targets: [
        `- BMI: ${targets.bmi}`,
        `- Estimated maintenance: ${targets.maintenance} kcal/day`,
        `- Target: ${targets.calories} kcal/day (+${targets.surplus} surplus)`,
        `- Protein: ${targets.protein_g} g, fat: ${targets.fat_g} g, carbs: ${targets.carbs_g} g`,
        `- Aim to gain ${targets.weekly_gain_kg} kg per week`,
      ].join("\n"),
      recentLogs: daysToText(days),
    });

    const { data: saved, error: saveError } = await supabase
      .from("plans")
      .insert({ consultation_id: consultation.id, targets, plan })
      .select("id")
      .single();
    if (saveError) throw saveError;
    return NextResponse.json({ id: saved.id });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
