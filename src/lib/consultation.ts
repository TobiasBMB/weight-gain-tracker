export type Question =
  | { id: string; label: string; help?: string; type: "number"; unit?: string; min?: number; max?: number; step?: number; required?: boolean }
  | { id: string; label: string; help?: string; type: "text" | "textarea" | "time"; placeholder?: string; required?: boolean }
  | { id: string; label: string; help?: string; type: "select"; options: string[]; required?: boolean }
  | { id: string; label: string; help?: string; type: "multiselect"; options: string[] }
  | { id: string; label: string; help?: string; type: "scale"; low: string; high: string };

export type Section = { id: string; title: string; intro: string; questions: Question[] };

export type Answers = Record<string, string | number | string[] | undefined>;

export const SECTIONS: Section[] = [
  {
    id: "about",
    title: "About you",
    intro: "The basics, so the numbers are right for your body.",
    questions: [
      { id: "age", label: "Age", type: "number", unit: "years", min: 16, max: 100, required: true },
      { id: "sex", label: "Sex", type: "select", options: ["Female", "Male"], required: true },
      { id: "height_cm", label: "Height", type: "number", unit: "cm", min: 120, max: 220, required: true },
      { id: "weight_kg", label: "Current weight", type: "number", unit: "kg", min: 30, max: 200, step: 0.1, required: true },
      { id: "previous_weight_kg", label: "What did you weigh when you felt your best?", type: "number", unit: "kg", min: 30, max: 200, step: 0.1 },
      { id: "loss_when", label: "When did the weight start coming off?", type: "select", options: ["Last 3 months", "3–6 months ago", "6–12 months ago", "Over a year ago", "Not sure"] },
      { id: "loss_trying", label: "Were you trying to lose weight?", type: "select", options: ["No, it just happened", "A bit", "Yes"] },
    ],
  },
  {
    id: "goals",
    title: "Your goals",
    intro: "What does success look like for you?",
    questions: [
      { id: "goal_weight_kg", label: "Goal weight", type: "number", unit: "kg", min: 30, max: 200, step: 0.1 },
      { id: "goal_areas", label: "Where would you most like to fill out?", type: "multiselect", options: ["Bum and hips", "Chest", "Arms", "Legs", "Face", "Overall"] },
      { id: "goal_feel", label: "How do you want to feel?", type: "textarea", placeholder: "e.g. stronger, less bony, more energy, clothes fitting again" },
    ],
  },
  {
    id: "routine",
    title: "A typical day",
    intro: "Roughly is fine. This helps fit meals around your life.",
    questions: [
      { id: "wake_time", label: "Usual wake-up time", type: "time" },
      { id: "bed_time", label: "Usual bedtime", type: "time" },
      { id: "work", label: "Work or daily routine", type: "textarea", placeholder: "e.g. office 9–5, school runs, shift work, at home with kids" },
      { id: "job_activity", label: "During the day you are mostly…", type: "select", options: ["Sitting", "A mix of sitting and moving", "On my feet most of the day"], required: true },
    ],
  },
  {
    id: "eating",
    title: "Eating",
    intro: "Be honest. Nobody else sees this, and it makes the plan work.",
    questions: [
      { id: "typical_day_food", label: "What do you eat on a normal day?", help: "Breakfast, lunch, dinner, snacks, drinks.", type: "textarea", placeholder: "e.g. coffee at 7, nothing till 1, salad for lunch, chicken and veg for dinner", required: true },
      { id: "meals_per_day", label: "Meals or snacks per day", type: "select", options: ["1", "2", "3", "4", "5+"] },
      { id: "skip_meals", label: "Do you skip meals?", type: "select", options: ["Rarely", "Sometimes", "Often", "Most days"] },
      { id: "appetite", label: "Your appetite lately", type: "scale", low: "Never hungry", high: "Always hungry" },
      { id: "full_quickly", label: "Do you feel full quickly?", type: "select", options: ["No", "Sometimes", "Yes, a few bites and I'm done"] },
      { id: "avoid_foods", label: "Foods you avoid, and why", help: "Include anything you cut out for your skin.", type: "textarea", placeholder: "e.g. dairy (skin), bread (bloating), red meat (don't like)" },
      { id: "diet_style", label: "Any eating style?", type: "select", options: ["Eat everything", "Vegetarian", "Vegan", "Pescatarian", "Gluten free", "Dairy free", "Other"] },
      { id: "favourite_foods", label: "Foods you love", type: "textarea", placeholder: "Helps the plan include things you'll actually eat" },
      { id: "coffee", label: "Coffee or energy drinks per day", type: "select", options: ["None", "1", "2", "3", "4+"] },
      { id: "alcohol", label: "Alcoholic drinks per week", type: "select", options: ["None", "1–3", "4–7", "8+"] },
      { id: "water", label: "Water per day", type: "select", options: ["Under 1 litre", "1–2 litres", "2+ litres"] },
      { id: "cooking", label: "Cooking", type: "select", options: ["I cook most meals", "Sometimes", "Mostly takeaway or ready meals"] },
    ],
  },
  {
    id: "activity",
    title: "Exercise and activity",
    intro: "Training the right way helps the weight go on as shape, not just fat.",
    questions: [
      { id: "gym_days", label: "Gym sessions per week", type: "select", options: ["0", "1", "2", "3", "4", "5+"], required: true },
      { id: "gym_type", label: "What do you do at the gym?", type: "multiselect", options: ["Weights", "Classes (e.g. pump, HIIT)", "Treadmill / bike / cardio", "Pilates or yoga", "Not sure what to do"] },
      { id: "walk_minutes", label: "Walking per day", type: "select", options: ["Under 15 min", "15–30 min", "30–60 min", "Over an hour"], required: true },
      { id: "other_activity", label: "Other sport or activity", type: "textarea", placeholder: "e.g. netball on Tuesdays, running, dancing" },
    ],
  },
  {
    id: "skin",
    title: "Skin",
    intro: "Stress, food and hormones can link skin and weight. This helps the plan avoid making your skin worse.",
    questions: [
      { id: "skin_started", label: "When did the breakouts start?", type: "select", options: ["No breakouts", "Last 3 months", "3–6 months ago", "6–12 months ago", "Over a year ago"] },
      { id: "skin_now", label: "How is your skin now?", type: "scale", low: "Really bad", high: "Clear" },
      { id: "skin_where", label: "Where on your face?", type: "multiselect", options: ["Chin and jaw", "Cheeks", "Forehead", "Around the mouth", "All over", "Body too"] },
      { id: "skin_tried", label: "What have you tried?", type: "textarea", placeholder: "Creams, prescriptions, diet changes. What helped?" },
      { id: "skin_triggers", label: "Anything you think makes it worse?", type: "textarea", placeholder: "e.g. dairy, sugar, stress, before my period" },
      { id: "skin_doctor", label: "Have you seen a GP or dermatologist about it?", type: "select", options: ["No", "GP", "Dermatologist", "Both"] },
    ],
  },
  {
    id: "stress",
    title: "Stress and sleep",
    intro: "Stress is one of the biggest appetite killers.",
    questions: [
      { id: "stress_level", label: "Stress over the last few months", type: "scale", low: "Calm", high: "Overwhelmed" },
      { id: "stress_causes", label: "What's been stressing you?", type: "textarea", placeholder: "Only share what you're comfortable with" },
      { id: "stress_appetite", label: "When stressed, you…", type: "select", options: ["Eat less", "Eat the same", "Eat more"] },
      { id: "sleep_hours", label: "Hours of sleep per night", type: "number", unit: "hours", min: 2, max: 14, step: 0.5 },
      { id: "sleep_quality", label: "Sleep quality", type: "scale", low: "Terrible", high: "Great" },
    ],
  },
  {
    id: "health",
    title: "Health",
    intro: "These help spot anything worth a quick check with a doctor.",
    questions: [
      { id: "periods", label: "Your periods", type: "select", options: ["Regular, no change", "Changed recently (lighter, irregular or stopped)", "On contraception that changes them", "Menopause or not applicable"] },
      { id: "contraception", label: "Contraception or hormone medication", type: "text", placeholder: "e.g. the pill, Mirena, none" },
      { id: "medications", label: "Other medications", type: "textarea", placeholder: "Include anything for skin, mood, ADHD or weight. These can affect appetite." },
      { id: "supplements_now", label: "Supplements you already take", type: "textarea", placeholder: "e.g. multivitamin, iron, protein powder" },
      { id: "conditions", label: "Any health conditions or symptoms?", type: "multiselect", options: ["Thyroid issues", "Coeliac or gut problems", "Low iron", "PCOS", "Anxiety or depression", "Tired all the time", "Hair thinning", "Feeling cold a lot", "Racing heart", "None"] },
      { id: "digestion", label: "Digestion", type: "select", options: ["Fine", "Bloating", "Reflux", "Constipation", "Loose or urgent", "A mix"] },
      { id: "last_blood_test", label: "Last blood test", type: "select", options: ["Last 6 months", "6–12 months ago", "Over a year ago", "Can't remember"] },
    ],
  },
  {
    id: "mindset",
    title: "Mindset",
    intro: "Last one. Gaining weight can feel harder than it sounds.",
    questions: [
      { id: "feel_eating_more", label: "How do you feel about eating more?", type: "select", options: ["Keen", "Fine but I forget", "It's hard, I'm never hungry", "Worried about gaining in the wrong places", "Anxious about it"] },
      { id: "barriers", label: "What makes it hard?", type: "textarea", placeholder: "e.g. busy, no appetite, don't know what to eat, cost" },
      { id: "anything_else", label: "Anything else the plan should know?", type: "textarea" },
    ],
  },
];

export const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions);

/** Renders answers as labelled lines for the AI prompt. Skipped questions are left out. */
export function answersToText(answers: Answers) {
  const lines: string[] = [];
  for (const section of SECTIONS) {
    const rows = section.questions
      .map((q) => {
        const v = answers[q.id];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return null;
        let text = Array.isArray(v) ? v.join(", ") : String(v);
        if (q.type === "number" && q.unit) text += ` ${q.unit}`;
        if (q.type === "scale") text += ` (1 = ${q.low}, 5 = ${q.high})`;
        return `- ${q.label}: ${text}`;
      })
      .filter(Boolean);
    if (rows.length) lines.push(`## ${section.title}`, ...(rows as string[]), "");
  }
  return lines.join("\n");
}
