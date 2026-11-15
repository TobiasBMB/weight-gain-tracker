"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/allowed";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function readForm(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match." };
  redirect("/");
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData);
  if (!isAllowedEmail(email)) return { error: "This app is private. Ask Tobias to add your email." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/");
  return { message: "Check your email for a link to confirm your account." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
