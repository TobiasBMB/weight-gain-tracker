"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS, type Answers, type Question } from "@/lib/consultation";
import { Chip } from "@/components/Chip";
import { saveConsultation } from "./actions";

export function ConsultationForm({ initial, isRedo }: { initial: Answers; isRedo: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "planning">("idle");
  const [error, setError] = useState("");

  const set = (id: string, v: Answers[string]) => setAnswers((a) => ({ ...a, [id]: v }));

  if (step === -1) {
    return (
      <section className="card space-y-4">
        <h1 className="text-2xl font-semibold text-rose-900">{isRedo ? "Update your consultation" : "Your consultation"}</h1>
        <p className="text-stone-700">
          {SECTIONS.length} short sections about your routine, eating, exercise, skin, stress and health. It takes about 10
          minutes. Your answers are private to your account.
        </p>
        <p className="text-stone-700">Skip anything you don&apos;t want to answer. The more you share, the better your plan.</p>
        <button className="btn-primary w-full" onClick={() => setStep(0)}>
          {isRedo ? "Review my answers" : "Let's start"}
        </button>
      </section>
    );
  }

  const section = SECTIONS[step];
  const last = step === SECTIONS.length - 1;

  async function finish() {
    setError("");
    setStatus("saving");
    const saved = await saveConsultation(answers);
    if (saved.error) {
      setError(saved.error);
      setStatus("idle");
      return;
    }
    setStatus("planning");
    const res = await fetch("/api/plan", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(`Your answers are saved, but the plan didn't generate. ${body.error ?? ""} You can retry from My plan.`);
      setStatus("idle");
      return;
    }
    router.push("/plan");
    router.refresh();
  }

  if (status === "planning") {
    return (
      <section className="card space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-700" />
        <h2 className="text-lg font-semibold text-rose-900">Writing your plan…</h2>
        <p className="text-stone-600">This usually takes under a minute.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="h-2 overflow-hidden rounded-full bg-rose-100">
          <div className="h-full bg-rose-600 transition-all" style={{ width: `${((step + 1) / SECTIONS.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Section {step + 1} of {SECTIONS.length}
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-rose-900">{section.title}</h2>
          <p className="mt-1 text-stone-600">{section.intro}</p>
        </div>
        {section.questions.map((q) => (
          <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
        ))}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button className="btn-secondary flex-1" onClick={() => setStep(step - 1)} disabled={status !== "idle"}>
          Back
        </button>
        {last ? (
          <button className="btn-primary flex-1" onClick={finish} disabled={status !== "idle"}>
            {status === "saving" ? "Saving…" : "Finish and get my plan"}
          </button>
        ) : (
          <button
            className="btn-primary flex-1"
            onClick={() => {
              setStep(step + 1);
              window.scrollTo({ top: 0 });
            }}
          >
            Next
          </button>
        )}
      </div>
    </section>
  );
}

function Field({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: Answers[string]) => void }) {
  const label = (
    <span className="label">
      {q.label}
      {"required" in q && q.required && <span className="text-rose-700"> *</span>}
    </span>
  );
  const help = q.help && <span className="mt-0.5 block text-sm text-stone-500">{q.help}</span>;

  switch (q.type) {
    case "number":
      return (
        <label className="block">
          {label}
          {help}
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={q.min}
              max={q.max}
              step={q.step ?? 1}
              value={value === undefined ? "" : String(value)}
              onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              className="input"
            />
            {q.unit && <span className="text-stone-500">{q.unit}</span>}
          </div>
        </label>
      );
    case "text":
    case "time":
      return (
        <label className="block">
          {label}
          {help}
          <input
            type={q.type}
            placeholder={q.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1"
          />
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          {label}
          {help}
          <textarea
            rows={3}
            placeholder={q.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-1"
          />
        </label>
      );
    case "select":
      return (
        <fieldset>
          <legend>{label}</legend>
          {help}
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <Chip key={o} active={value === o} onClick={() => onChange(value === o ? undefined : o)}>
                {o}
              </Chip>
            ))}
          </div>
        </fieldset>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset>
          <legend>{label}</legend>
          {help}
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <Chip
                key={o}
                active={selected.includes(o)}
                onClick={() => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o])}
              >
                {o}
              </Chip>
            ))}
          </div>
        </fieldset>
      );
    }
    case "scale":
      return (
        <fieldset>
          <legend>{label}</legend>
          {help}
          <div className="mt-2 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} active={value === n} onClick={() => onChange(value === n ? undefined : n)}>
                {n}
              </Chip>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-stone-500">
            <span>{q.low}</span>
            <span>{q.high}</span>
          </div>
        </fieldset>
      );
  }
}
