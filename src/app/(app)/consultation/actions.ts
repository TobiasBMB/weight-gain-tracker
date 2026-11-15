"use server";

import { ALL_QUESTIONS, type Answers } from "@/lib/consultation";
import { createClient } from "@/lib/supabase/server";

/** Keeps only known questions with values of the right shape. */
function clean(raw: Answers): Answers {
  const out: Answers = {};
  for (const q of ALL_QUESTIONS) {
    const v = raw[q.id];
    if (v === undefined || v === "" || v === null) continue;
    switch (q.type) {
      case "number": {
        const n = Number(v);
        if (Number.isFinite(n) && (q.min === undefined || n >= q.min) && (q.max === undefined || n <= q.max)) out[q.id] = n;
        break;
      }
      case "scale": {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 1 && n <= 5) out[q.id] = n;
        break;
      }
      case "select":
        if (q.options.includes(String(v))) out[q.id] = String(v);
        break;
      case "multiselect":
        if (Array.isArray(v)) out[q.id] = v.filter((o) => q.options.includes(o));
        break;
      case "time":
        if (/^\d{2}:\d{2}$/.test(String(v))) out[q.id] = String(v);
        break;
      default:
        out[q.id] = String(v).slice(0, 2000);
    }
  }
  return out;
}

export async function saveConsultation(raw: Answers): Promise<{ error?: string }> {
  const answers = clean(raw);
  const missing = ALL_QUESTIONS.filter((q) => "required" in q && q.required && answers[q.id] === undefined);
  if (missing.length) return { error: `Please answer: ${missing.map((q) => q.label).join(", ")}` };

  const supabase = await createClient();
  const { error } = await supabase.from("consultations").insert({ answers });
  if (error) return { error: "Couldn't save your answers. Please try again." };
  return {};
}
