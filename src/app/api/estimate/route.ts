import { NextResponse } from "next/server";
import { estimateFood } from "@/lib/ai";
import { aiErrorResponse, requireAiUser } from "@/lib/api";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!description || description.length > 1000) {
    return NextResponse.json({ error: "Describe what you ate (up to 1000 characters)." }, { status: 400 });
  }

  try {
    return NextResponse.json(await estimateFood(description));
  } catch (err) {
    return aiErrorResponse(err);
  }
}
