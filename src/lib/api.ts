import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { isAllowedEmail } from "./allowed";
import { getUser } from "./supabase/server";

/** Signed-in, allow-listed user for AI routes, or an error response. */
export async function requireAiUser() {
  const { supabase, user } = await getUser();
  if (!user) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) } as const;
  if (!isAllowedEmail(user.email)) {
    return { error: NextResponse.json({ error: "This account isn't allowed to use the AI features." }, { status: 403 }) } as const;
  }
  return { supabase, user } as const;
}

export function aiErrorResponse(err: unknown) {
  console.error(err);
  let message = err instanceof Error ? err.message : "Something went wrong.";
  let status = 500;
  if (err instanceof Anthropic.RateLimitError) {
    message = "The AI is busy right now. Try again in a minute.";
    status = 429;
  } else if (err instanceof Anthropic.AuthenticationError) {
    message = "The AI key isn't set up correctly.";
  } else if (err instanceof Anthropic.APIError) {
    message = "The AI service had a problem. Try again shortly.";
    status = 502;
  }
  return NextResponse.json({ error: message }, { status });
}
