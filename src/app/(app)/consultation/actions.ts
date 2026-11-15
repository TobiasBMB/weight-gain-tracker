"use server";

import { ALL_QUESTIONS, cleanAnswers, type Answers } from "@/lib/consultation";
import { createClient } from "@/lib/supabase/server";

export async function saveConsultation(raw: Answers): Promise<{ error?: string }> {
  const answers = cleanAnswers(raw);
  const missing = ALL_QUESTIONS.filter((q) => "required" in q && q.required && answers[q.id] === undefined);
  if (missing.length) return { error: `Please answer: ${missing.map((q) => q.label).join(", ")}` };

  const supabase = await createClient();
  const { error } = await supabase.from("consultations").insert({ answers });
  if (error) return { error: "Couldn't save your answers. Please try again." };
  return {};
}
