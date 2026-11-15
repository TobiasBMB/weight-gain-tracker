import type { ChatAction } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { Chat, type Message } from "./Chat";

export default async function ChatPage() {
  const supabase = await createClient();
  const [{ data }, { data: consultation }] = await Promise.all([
    supabase.from("chat_messages").select("id, role, content, actions, created_at").order("created_at", { ascending: false }).limit(60),
    supabase.from("consultations").select("answers").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const name = (consultation?.answers as Record<string, unknown> | undefined)?.preferred_name;
  const messages = ((data ?? []) as (Message & { actions: ChatAction[] })[]).reverse();
  return <Chat initial={messages} name={typeof name === "string" ? name.trim().slice(0, 40) : ""} />;
}
