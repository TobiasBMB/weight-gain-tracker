import { NextResponse } from "next/server";
import { aiErrorResponse, requireAiUser } from "@/lib/api";
import { chat, type ChatAction, type HistoryMessage } from "@/lib/chat";
import { dayKey, startOfDay } from "@/lib/dates";

export const maxDuration = 120;

const MAX_MESSAGES_PER_DAY = 150;
const HISTORY = 24;

export async function POST(request: Request) {
  const auth = await requireAiUser();
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Type a message (up to 2000 characters)." }, { status: 400 });
  }

  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", startOfDay(dayKey()).toISOString());
  if ((count ?? 0) >= MAX_MESSAGES_PER_DAY) {
    return NextResponse.json({ error: "That's a lot of chatting for one day. Let's pick it up tomorrow." }, { status: 429 });
  }

  const { data: recent, error } = await supabase
    .from("chat_messages")
    .select("role, content, actions")
    .order("created_at", { ascending: false })
    .limit(HISTORY);
  if (error) return aiErrorResponse(error);

  // Oldest first, starting with one of her messages.
  const history = ((recent ?? []) as HistoryMessage[]).reverse();
  while (history.length && history[0].role !== "user") history.shift();

  try {
    const { reply, actions } = await chat(supabase, user.id, history, message);
    // Distinct timestamps keep the pair in order (both rows would otherwise share now()).
    const at = Date.now();
    const { data: saved, error: saveError } = await supabase
      .from("chat_messages")
      .insert([
        { role: "user", content: message, actions: [], created_at: new Date(at - 1).toISOString() },
        { role: "assistant", content: reply, actions, created_at: new Date(at).toISOString() },
      ])
      .select("id, role, content, actions, created_at");
    if (saveError) throw saveError;
    return NextResponse.json({ messages: saved as { id: string; role: string; content: string; actions: ChatAction[]; created_at: string }[] });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
