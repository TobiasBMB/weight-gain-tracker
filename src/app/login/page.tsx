"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "in" ? signIn : signUp, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-rose-900">Nourish</h1>
      <p className="mt-2 text-stone-600">Your private plan for gaining healthy weight.</p>

      <form action={action} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input name="email" type="email" autoComplete="email" required className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
            minLength={mode === "up" ? 8 : undefined}
            className="input mt-1"
          />
        </label>
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
        <button disabled={pending} className="btn-primary w-full">
          {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 text-sm text-rose-800 underline underline-offset-4"
      >
        {mode === "in" ? "First time? Create your account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
