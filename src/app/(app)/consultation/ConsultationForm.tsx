"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chip, Scale } from "@/components/Chip";
import { Icon } from "@/components/Icon";
import { SECTIONS, type Answers, type Question } from "@/lib/consultation";
import { saveConsultation } from "./actions";

export function ConsultationForm({ initial, isRedo }: { initial: Answers; isRedo: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "planning">("idle");
  const [error, setError] = useState("");

  const set = (id: string, v: Answers[string]) => setAnswers((a) => ({ ...a, [id]: v }));
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  if (step === -1) {
    return (
      <section className="card space-y-4">
        <span className="eyebrow">Consultation</span>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          {isRedo ? "Update your answers" : "Let's get to know you"}
        </h1>
        <p className="leading-relaxed text-soft">
          {SECTIONS.length} short sections about your routine, eating, exercise, skin, stress and health. About 10 minutes.
        </p>
        <p className="leading-relaxed text-soft">
          Only you can see your answers. Skip anything you don&apos;t want to answer, but the more you share, the better your plan.
        </p>
        <button className="btn-primary w-full" onClick={() => go(0)}>
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
      <section className="card space-y-3 py-10 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-line border-t-baby" />
        <h2 className="text-lg font-bold">Writing your plan…</h2>
        <p className="text-muted">This usually takes under a minute.</p>
      </section>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-3 px-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft" aria-hidden="true">
          <div className="h-full rounded-full bg-baby transition-all" style={{ width: `${((step + 1) / SECTIONS.length) * 100}%` }} />
        </div>
        <span className="text-sm text-muted">
          {step + 1} of {SECTIONS.length}
        </span>
      </div>

      <section className="card space-y-5">
        <div className="space-y-1.5">
          <span className="eyebrow">{section.title}</span>
          <p className="text-[15px] leading-relaxed text-soft">{section.intro}</p>
        </div>
        {section.questions.map((q) => (
          <Field key={q.id} q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} />
        ))}
      </section>

      {error && <p className="px-1 text-sm text-danger">{error}</p>}

      <div className="flex gap-2.5">
        <button className="btn-secondary flex-1" onClick={() => go(step - 1)} disabled={status !== "idle"}>
          Back
        </button>
        {last ? (
          <button className="btn-primary flex-1" onClick={finish} disabled={status !== "idle"}>
            {status === "saving" ? "Saving…" : "Get my plan"}
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={() => go(step + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ q, value, onChange }: { q: Question; value: Answers[string]; onChange: (v: Answers[string]) => void }) {
  const title = (
    <span className="block text-[17px] font-bold leading-snug">
      {q.label}
      {"required" in q && q.required && <span className="text-blush"> *</span>}
    </span>
  );
  const help = q.help && <span className="mt-0.5 block text-sm text-muted">{q.help}</span>;

  switch (q.type) {
    case "number":
      return (
        <label className="block">
          {title}
          {help}
          <div className="mt-2 flex items-center gap-2">
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
            {q.unit && <span className="w-12 shrink-0 text-muted">{q.unit}</span>}
          </div>
        </label>
      );
    case "text":
    case "time":
      return (
        <label className="block">
          {title}
          {help}
          <input
            type={q.type}
            placeholder={q.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-2"
          />
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          {title}
          {help}
          <textarea
            rows={3}
            placeholder={q.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="input mt-2 resize-none"
          />
        </label>
      );
    case "select":
      // Short answers (counts, yes/no) read best as chips; longer ones as a list.
      if (q.options.every((o) => o.length <= 14)) {
        return (
          <fieldset>
            <legend>{title}</legend>
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
      }
      return (
        <fieldset>
          <legend>{title}</legend>
          {help}
          <div className="mt-2 space-y-2">
            {q.options.map((o) => {
              const on = value === o;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? undefined : o)}
                  className={`flex min-h-[52px] w-full items-center gap-3 rounded-[14px] border px-4 text-left text-[15px] font-medium ${
                    on ? "border-baby bg-baby-dim" : "border-line hover:border-muted"
                  }`}
                >
                  <span className={`h-5 w-5 shrink-0 rounded-full ${on ? "border-[6px] border-baby" : "border-2 border-[#3A4A6B]"}`} />
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset>
          <legend>{title}</legend>
          {help}
          <span className="mt-0.5 block text-sm text-muted">Pick any that apply.</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <Chip
                key={o}
                active={selected.includes(o)}
                onClick={() => onChange(selected.includes(o) ? selected.filter((s) => s !== o) : [...selected, o])}
              >
                {selected.includes(o) && <Icon name="check" size={14} strokeWidth={2.6} className="-ml-0.5 mr-1 inline" />}
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
          <legend>{title}</legend>
          {help}
          <div className="mt-2">
            <Scale label={q.label} value={value as number | undefined} onChange={(n) => onChange(n ?? undefined)} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{q.low}</span>
            <span>{q.high}</span>
          </div>
        </fieldset>
      );
  }
}
