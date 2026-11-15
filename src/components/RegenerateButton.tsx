"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegenerateButton({ label, primary = false }: { label: string; primary?: boolean }) {
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
      <button className={`${primary ? "btn-primary" : "btn-outline"} w-full`} onClick={run} disabled={busy}>
        {busy ? "Writing your plan… (up to a minute)" : label}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
