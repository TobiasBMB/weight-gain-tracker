import type { Answers } from "@/lib/consultation";
import { createClient } from "@/lib/supabase/server";
import { ConsultationForm } from "./ConsultationForm";

export default async function ConsultationPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("consultations")
    .select("answers")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <ConsultationForm initial={(data?.answers as Answers) ?? {}} isRedo={Boolean(data)} />;
}
