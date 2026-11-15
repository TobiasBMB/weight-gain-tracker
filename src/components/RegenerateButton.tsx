"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegenerateButton({ label }: { label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/plan", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div>
      <button className="btn-primary w-full" onClick={run} disabled={busy}>
        {busy ? "Writing your plan… (up to a minute)" : label}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
