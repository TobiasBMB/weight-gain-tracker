"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "in" ? signIn : signUp, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="card">
        <h1 className="text-3xl font-extrabold tracking-tight">Nourish</h1>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          <span className="h-1 w-7 rounded-full bg-baby" />
          <span className="h-1 w-7 rounded-full bg-blush" />
        </div>
        <p className="mt-3 text-muted">Your private plan for gaining healthy weight.</p>

        <form action={action} className="mt-6 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input name="email" type="email" autoComplete="email" required className="input mt-1.5" />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={mode === "up" ? 8 : undefined}
              className="input mt-1.5"
            />
          </label>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.message && <p className="text-sm text-baby">{state.message}</p>}
          <button disabled={pending} className="btn-primary w-full">
            {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 text-sm font-medium text-baby"
      >
        {mode === "in" ? "First time? Create your account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
