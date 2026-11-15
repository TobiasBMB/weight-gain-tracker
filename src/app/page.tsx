import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { count } = await supabase.from("consultations").select("id", { count: "exact", head: true });
  redirect(count ? "/today" : "/consultation");
}
