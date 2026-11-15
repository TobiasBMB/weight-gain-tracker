import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const MODEL = "claude-opus-5-5";

const client = new Anthropic();

export const PlanSchema = z.object({
  summary: z.string().describe("2-4 warm, plain-English sentences on where she is and the approach"),
  likely_factors: z.array(z.string()).describe("What is probably behind the weight loss, based on her answers and logs"),
  daily_plan: z
    .array(
      z.object({
        time: z.string().describe("e.g. 7:00am"),
        meal: z.string().describe("e.g. Breakfast, Morning snack"),
        foods: z.string(),
        calories: z.number(),
        protein_g: z.number(),
      }),
    )
    .describe("A sample day that fits her routine and hits the calorie and protein targets"),
  easy_wins: z.array(z.string()).describe("Small, specific changes that add calories without big meals"),
  swaps: z.array(z.object({ instead_of: z.string(), try: z.string(), why: z.string() })),
  grocery_list: z.array(z.string()),
  supplements: z
    .array(
      z.object({
        name: z.string(),
        dose: z.string(),
        timing: z.string(),
        why: z.string(),
        caution: z.string(),
      }),
    )
    .describe("Only well-evidenced options that fit her situation"),
  training: z.array(z.string()).describe("How to train so the weight goes on as shape and muscle"),
  skin_and_stress: z.array(z.string()).describe("Food and habit notes that are kind to her skin and stress levels"),
  check_with_doctor: z
    .array(z.object({ reason: z.string(), urgency: z.enum(["routine", "soon"]) }))
    .describe("Things in her answers worth raising with a GP"),
  this_week_focus: z.string().describe("One clear thing to focus on this week"),
  progress_notes: z.string().describe("How her recent logs compare with the targets. Empty string if there are no logs yet"),
});

export type Plan = z.infer<typeof PlanSchema>;

const PLAN_SYSTEM = `You are a warm, practical nutrition coach helping a woman in Australia regain weight she lost, so she looks and feels healthy again. You work from her private consultation answers, her calculated daily targets and, when available, her recent food, activity and check-in logs.

How to write:
- Plain, friendly Australian English. Short sentences. No jargon, no lecturing, no guilt.
- Be specific to her: use her routine, foods she likes, and what she avoids. Use foods easy to buy at Woolworths or Coles, in metric units.
- The calorie and protein targets are already calculated. Build the sample day to land close to them, and keep each item's calories realistic.
- If her appetite is low or she fills up fast, favour calorie-dense, low-volume foods, liquid calories (smoothies, milk drinks), and more frequent small meals over bigger plates.
- Weight should go on gradually as muscle and curves, so pair food with resistance training (glutes, legs, back, chest, arms) 2-4 times a week with progressive overload. Suggest keeping long cardio moderate.

Skin:
- She has a history of breakouts and stress about her skin. Prefer whole foods, omega-3 rich fish, nuts, olive oil, avocado, oats, rice, potatoes and eggs over sugary or highly processed calorie sources.
- Whey protein and large amounts of skim milk trigger acne in some people. If she reports breakouts, suggest plant protein (pea or rice) or food-first protein, and say whey is fine if she tolerates it.
- Do not promise any food will cure acne.

Supplements:
- Only recommend options with good evidence and safe for most adults: protein powder, creatine monohydrate (3-5 g daily), vitamin D and iron only if a blood test shows she is low, omega-3 if she rarely eats oily fish, and a general multivitamin only where her diet is limited.
- Never recommend appetite stimulant drugs, hormones, or anything that needs a prescription. Mention checking with a pharmacist or GP if she takes medications or could be pregnant.

Safety:
- You are not her doctor and do not diagnose. Flag things worth a GP visit, such as unintentional weight loss, BMI under 18.5, changed or missing periods, feeling cold, hair thinning, racing heart, gut symptoms or fatigue (thyroid, coeliac disease, iron, and hormone checks are reasonable to mention).
- If her answers suggest anxiety about eating, restriction, or fear of weight gain, gently mention that a GP or the Butterfly Foundation (1800 33 4673) can help, without being alarming.`;

async function parse<T extends z.ZodType>(params: {
  system: string;
  user: string;
  schema: T;
  effort: "low" | "medium" | "high";
  maxTokens: number;
}): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: params.maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: params.effort, format: betaZodOutputFormat(params.schema) },
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined this request. Try rewording it.");
  }
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new Error("The AI response was incomplete. Please try again.");
  }
  return response.parsed_output as z.infer<T>;
}

export function generatePlan(input: { consultation: string; targets: string; recentLogs: string }) {
  return parse({
    system: PLAN_SYSTEM,
    schema: PlanSchema,
    effort: "medium",
    maxTokens: 16000,
    user: `# Consultation answers\n${input.consultation}\n\n# Daily targets\n${input.targets}\n\n# Recent logs\n${input.recentLogs || "No logs yet."}\n\nWrite her personal plan.`,
  });
}

export const EstimateSchema = z.object({
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  note: z.string().describe("One short line on assumptions, e.g. portion sizes. Empty if obvious"),
});

export type Estimate = z.infer<typeof EstimateSchema>;

export function estimateFood(description: string) {
  return parse({
    system:
      "Estimate the nutrition of food described by a woman in Australia. Assume typical Australian portion sizes when none are given. Give whole-number calories and grams rounded to one decimal place. Be realistic, not conservative.",
    schema: EstimateSchema,
    effort: "low",
    maxTokens: 2000,
    user: description,
  });
}
