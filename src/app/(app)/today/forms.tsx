"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Chip, Scale } from "@/components/Chip";
import { Icon } from "@/components/Icon";
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

const MEALS = ["breakfast", "lunch", "dinner", "snack", "drink"];

/** Full-screen food logger with AI estimate. Returns to Today after saving. */
export function FoodForm({ day }: { day: string }) {
  const router = useRouter();
  const { state, formAction, pending } = useSaved(addFood, () => router.push(`/today?day=${day}`));
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

  const fields = [
    ["calories", "Calories", "text-baby text-2xl font-extrabold"],
    ["protein_g", "Protein (g)", "text-blush text-2xl font-extrabold"],
    ["carbs_g", "Carbs (g)", "text-fg text-xl font-bold"],
    ["fat_g", "Fat (g)", "text-fg text-xl font-bold"],
  ] as const;

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="meal" value={meal} />

      <section className="card space-y-3.5">
        <div className="flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <Chip key={m} active={meal === m} onClick={() => setMeal(m)}>
              <span className="capitalize">{m}</span>
            </Chip>
          ))}
        </div>
        <label className="block">
          <span className="label">What did you have?</span>
          <textarea
            name="description"
            rows={3}
            required
            maxLength={1000}
            placeholder="e.g. 2 eggs on sourdough with half an avo and a flat white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input mt-1.5 resize-none leading-snug"
          />
        </label>
        <label className="flex h-12 items-center justify-between rounded-[14px] border border-line px-3.5">
          <span className="label">Time</span>
          <input name="time" type="time" required defaultValue={nowTime()} className="bg-transparent text-base font-semibold text-fg" />
        </label>
        <button type="button" className="btn-outline w-full" onClick={estimate} disabled={!description.trim() || estimating}>
          {estimating ? "Estimating…" : "Estimate calories and protein"}
        </button>
        {estimateError && <p className="text-sm text-danger">{estimateError}</p>}
      </section>

      <section className="card space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">Estimate</h2>
          <span className="text-[13px] text-muted">You can edit these</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map(([k, label, cls]) => (
            <label key={k} className="row block">
              <span className="block text-[13px] text-muted">{label}</span>
              <input
                name={k}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="–"
                value={macros[k]}
                onChange={(e) => setMacros((m) => ({ ...m, [k]: e.target.value }))}
                className={`w-full bg-transparent outline-none placeholder:text-muted ${cls}`}
              />
            </label>
          ))}
        </div>
        {note && <p className="text-[13px] leading-snug text-muted">{note}</p>}
      </section>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
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
    <form action={formAction} className="space-y-3 rounded-[14px] border border-line p-3.5">
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
          <input name="minutes" type="number" inputMode="numeric" min={1} max={1440} required className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="label">Time</span>
          <input name="time" type="time" required defaultValue={nowTime()} className="input mt-1.5" />
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
        <input name="description" maxLength={1000} placeholder="e.g. legs and glutes, 3 sets each" className="input mt-1.5" />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
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
  { name: "stress", label: "Stress", low: "Calm", high: "Very stressed", color: "blush" },
  { name: "skin", label: "Skin", low: "Bad day", high: "Clear", color: "baby" },
  { name: "sleep_quality", label: "Sleep", low: "Terrible", high: "Great", color: "baby" },
  { name: "appetite", label: "Appetite", low: "None", high: "Hungry", color: "baby" },
  { name: "energy", label: "Energy", low: "Flat", high: "Great", color: "baby" },
] as const;

export function CheckinForm({ day, initial }: { day: string; initial: Checkin | null }) {
  const [saved, setSaved] = useState(false);
  const { state, formAction, pending } = useSaved(saveCheckin, () => setSaved(true));
  const [scales, setScales] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(SCALES.map((s) => [s.name, initial?.[s.name] ?? null])),
  );
  const [showMore, setShowMore] = useState(Boolean(initial?.hips_cm || initial?.chest_cm || initial?.arm_cm || initial?.waist_cm));
  const v = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

  return (
    <form action={formAction} onChange={() => setSaved(false)} className="space-y-3.5">
      <input type="hidden" name="day" value={day} />
      {SCALES.map((s) => (
        <fieldset key={s.name}>
          <input type="hidden" name={s.name} value={v(scales[s.name])} />
          <div className="flex items-center gap-2.5">
            <legend className="w-[72px] shrink-0 text-sm text-soft">{s.label}</legend>
            <div className="flex-1">
              <Scale
                label={s.label}
                color={s.color}
                value={scales[s.name]}
                onChange={(n) => {
                  setSaved(false);
                  setScales((x) => ({ ...x, [s.name]: n }));
                }}
              />
            </div>
          </div>
          <div className="mt-0.5 flex justify-between pl-[82px] text-xs text-muted">
            <span>{s.low}</span>
            <span>{s.high}</span>
          </div>
        </fieldset>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="label">Sleep (hours)</span>
          <input name="sleep_hours" type="number" inputMode="decimal" step="0.5" min={0} max={24} defaultValue={v(initial?.sleep_hours)} className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="label">Weight (kg)</span>
          <input name="weight_kg" type="number" inputMode="decimal" step="0.1" min={20} max={300} defaultValue={v(initial?.weight_kg)} className="input mt-1.5" />
        </label>
      </div>
      {showMore ? (
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
              <input name={k} type="number" inputMode="decimal" step="0.1" defaultValue={v(initial?.[k])} className="input mt-1.5" />
            </label>
          ))}
        </div>
      ) : (
        <button type="button" className="text-sm font-medium text-baby" onClick={() => setShowMore(true)}>
          + Add measurements (monthly is plenty)
        </button>
      )}
      <label className="block">
        <span className="label">Notes</span>
        <textarea name="notes" rows={2} maxLength={2000} defaultValue={initial?.notes ?? ""} placeholder="Anything worth remembering about today" className="input mt-1.5 resize-none" />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
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
      className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-danger"
    >
      <Icon name="x" size={18} />
    </button>
  );
}
