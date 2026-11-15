"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Chip } from "@/components/Chip";
import { TIME_ZONE } from "@/lib/dates";
import type { Checkin } from "@/lib/logs";
import { addActivity, addFood, deleteEntry, saveCheckin, type ActionResult } from "./actions";

function nowTime() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
}

function guessMeal() {
  const h = Number(nowTime().slice(0, 2));
  if (h < 10) return "breakfast";
  if (h >= 11 && h < 14) return "lunch";
  if (h >= 17 && h < 21) return "dinner";
  return "snack";
}

/** Runs `onSuccess` after each successful submit (not on first render). */
function useSaved(action: (s: ActionResult, f: FormData) => Promise<ActionResult>, onSuccess: () => void) {
  const [state, formAction, pending] = useActionState(action, {});
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!state.error) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return { state, formAction, pending };
}

export function FoodForm({ day }: { day: string }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  if (!open) {
    return (
      <button className="btn-primary w-full" onClick={() => setOpen(true)}>
        + Add food or drink
      </button>
    );
  }
  return <FoodFormInner key={round} day={day} onDone={() => setRound((r) => r + 1)} onClose={() => setOpen(false)} />;
}

function FoodFormInner({ day, onDone, onClose }: { day: string; onDone: () => void; onClose: () => void }) {
  const { state, formAction, pending } = useSaved(addFood, onDone);
  const [meal, setMeal] = useState(guessMeal());
  const [description, setDescription] = useState("");
  const [macros, setMacros] = useState({ calories: "", protein_g: "", carbs_g: "", fat_g: "" });
  const [note, setNote] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  async function estimate() {
    setEstimating(true);
    setEstimateError("");
    const res = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setMacros({
        calories: String(Math.round(body.calories)),
        protein_g: String(body.protein_g),
        carbs_g: String(body.carbs_g),
        fat_g: String(body.fat_g),
      });
      setNote(body.note ?? "");
    } else {
      setEstimateError(body.error ?? "Couldn't estimate. Enter numbers yourself or save without them.");
    }
    setEstimating(false);
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-rose-50/60 p-3">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="meal" value={meal} />
      <div className="flex flex-wrap gap-2">
        {["breakfast", "lunch", "dinner", "snack", "drink"].map((m) => (
          <Chip key={m} active={meal === m} onClick={() => setMeal(m)}>
            <span className="capitalize">{m}</span>
          </Chip>
        ))}
      </div>
      <label className="block">
        <span className="label">What did you have?</span>
        <textarea
          name="description"
          rows={2}
          required
          maxLength={1000}
          placeholder="e.g. 2 eggs on sourdough with avocado, flat white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="label">Time</span>
        <input name="time" type="time" required defaultValue={nowTime()} className="input mt-1" />
      </label>

      <button type="button" className="btn-secondary w-full" onClick={estimate} disabled={!description.trim() || estimating}>
        {estimating ? "Estimating…" : "✨ Estimate calories and protein"}
      </button>
      {estimateError && <p className="text-sm text-red-700">{estimateError}</p>}
      {note && <p className="text-sm text-stone-600">{note}</p>}

      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ["calories", "kcal"],
            ["protein_g", "Protein g"],
            ["carbs_g", "Carbs g"],
            ["fat_g", "Fat g"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="block">
            <span className="text-xs text-stone-600">{label}</span>
            <input
              name={k}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={macros[k]}
              onChange={(e) => setMacros((m) => ({ ...m, [k]: e.target.value }))}
              className="input mt-0.5 px-2"
            />
          </label>
        ))}
      </div>

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Close
        </button>
        <button className="btn-primary flex-1" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function ActivityForm({ day }: { day: string }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  if (!open) {
    return (
      <button className="btn-secondary w-full" onClick={() => setOpen(true)}>
        + Add exercise or activity
      </button>
    );
  }
  return <ActivityFormInner key={round} day={day} onDone={() => setRound((r) => r + 1)} onClose={() => setOpen(false)} />;
}

function ActivityFormInner({ day, onDone, onClose }: { day: string; onDone: () => void; onClose: () => void }) {
  const { state, formAction, pending } = useSaved(addActivity, onDone);
  const [kind, setKind] = useState("gym");
  const [intensity, setIntensity] = useState("moderate");

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-rose-50/60 p-3">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="intensity" value={intensity} />
      <div className="flex flex-wrap gap-2">
        {["gym", "walk", "cardio", "sport", "yoga", "other"].map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            <span className="capitalize">{k}</span>
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label">Minutes</span>
          <input name="minutes" type="number" inputMode="numeric" min={1} max={1440} required className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Time</span>
          <input name="time" type="time" required defaultValue={nowTime()} className="input mt-1" />
        </label>
      </div>
      <div className="flex gap-2">
        {["light", "moderate", "hard"].map((i) => (
          <Chip key={i} active={intensity === i} onClick={() => setIntensity(i)}>
            <span className="capitalize">{i}</span>
          </Chip>
        ))}
      </div>
      <label className="block">
        <span className="label">Details (optional)</span>
        <input name="description" maxLength={1000} placeholder="e.g. legs and glutes, 3 sets each" className="input mt-1" />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Close
        </button>
        <button className="btn-primary flex-1" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

const SCALES = [
  { name: "stress", label: "Stress", low: "Calm", high: "Very stressed" },
  { name: "skin", label: "Skin", low: "Bad day", high: "Clear" },
  { name: "sleep_quality", label: "Sleep quality", low: "Terrible", high: "Great" },
  { name: "appetite", label: "Appetite", low: "None", high: "Hungry" },
  { name: "energy", label: "Energy", low: "Flat", high: "Great" },
] as const;

export function CheckinForm({ day, initial }: { day: string; initial: Checkin | null }) {
  const [saved, setSaved] = useState(false);
  const { state, formAction, pending } = useSaved(saveCheckin, () => setSaved(true));
  const [scales, setScales] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(SCALES.map((s) => [s.name, initial?.[s.name] ?? null])),
  );
  const [showMeasure, setShowMeasure] = useState(Boolean(initial?.hips_cm || initial?.chest_cm || initial?.arm_cm || initial?.waist_cm));
  const v = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

  return (
    <form action={formAction} onChange={() => setSaved(false)} className="space-y-4">
      <input type="hidden" name="day" value={day} />
      {SCALES.map((s) => (
        <fieldset key={s.name}>
          <input type="hidden" name={s.name} value={v(scales[s.name])} />
          <legend className="label">{s.label}</legend>
          <div className="mt-1.5 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip
                key={n}
                active={scales[s.name] === n}
                onClick={() => {
                  setSaved(false);
                  setScales((x) => ({ ...x, [s.name]: x[s.name] === n ? null : n }));
                }}
              >
                {n}
              </Chip>
            ))}
          </div>
          <div className="mt-0.5 flex justify-between text-xs text-stone-500">
            <span>{s.low}</span>
            <span>{s.high}</span>
          </div>
        </fieldset>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label">Sleep (hours)</span>
          <input name="sleep_hours" type="number" inputMode="decimal" step="0.5" min={0} max={24} defaultValue={v(initial?.sleep_hours)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="label">Weight (kg)</span>
          <input name="weight_kg" type="number" inputMode="decimal" step="0.1" min={20} max={300} defaultValue={v(initial?.weight_kg)} className="input mt-1" />
        </label>
      </div>
      {showMeasure ? (
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["hips_cm", "Hips (cm)"],
              ["chest_cm", "Chest (cm)"],
              ["arm_cm", "Upper arm (cm)"],
              ["waist_cm", "Waist (cm)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="block">
              <span className="label">{label}</span>
              <input name={k} type="number" inputMode="decimal" step="0.1" defaultValue={v(initial?.[k])} className="input mt-1" />
            </label>
          ))}
        </div>
      ) : (
        <button type="button" className="text-sm text-rose-800 underline" onClick={() => setShowMeasure(true)}>
          Add measurements (monthly is plenty)
        </button>
      )}
      <label className="block">
        <span className="label">Notes</span>
        <textarea name="notes" rows={2} maxLength={2000} defaultValue={initial?.notes ?? ""} placeholder="Anything worth remembering about today" className="input mt-1" />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : saved ? "Saved ✓" : initial ? "Update check-in" : "Save check-in"}
      </button>
    </form>
  );
}

export function DeleteButton({ table, id }: { table: "food_logs" | "activity_logs"; id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this entry?")) start(() => deleteEntry(table, id));
      }}
      className="shrink-0 px-2 text-stone-400 hover:text-red-700"
    >
      ✕
    </button>
  );
}
