"use client";

import { useEffect, useState } from "react";
import { InstallTip } from "@/components/InstallTip";
import { isIos, isStandalone } from "@/lib/pwa";
import { createClient } from "@/lib/supabase/client";
import { removeSubscription, saveSettings, saveSubscription, type ReminderSettings } from "./actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Status = "checking" | "unsupported" | "needs-install" | "denied" | "off" | "on";

function base64UrlToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function Reminders({ initial }: { initial: ReminderSettings }) {
  const [status, setStatus] = useState<Status>("checking");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        setStatus(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
      // Fetch the key up front: iOS only allows the permission prompt directly from a tap.
      const { data } = await createClient().functions.invoke("send-reminders", { body: { publicKey: true } });
      if (data?.publicKey) setPublicKey(data.publicKey);
    })();
  }, []);

  async function turnOn() {
    setMessage("");
    if (!publicKey) {
      setMessage("Still loading. Try again in a moment.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) }));
      const keys = sub.toJSON().keys ?? {};
      const result = await saveSubscription({
        endpoint: sub.endpoint,
        p256dh: keys.p256dh ?? "",
        auth: keys.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      await save(settings);
      setStatus("on");
      setMessage("Reminders are on. Send yourself a test below.");
    } catch (err) {
      console.error(err);
      setMessage("Couldn't turn on notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removeSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("off");
    setMessage("Reminders are off on this device.");
    setBusy(false);
  }

  async function test() {
    setMessage("");
    setBusy(true);
    const { data, error } = await createClient().functions.invoke("send-reminders", { body: { test: true } });
    if (error) {
      const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
      setMessage(body?.error ?? "Couldn't send a test.");
    } else {
      setMessage(data?.sent ? "Sent! It should arrive in a few seconds." : "Nothing was sent. Try turning reminders off and on again.");
    }
    setBusy(false);
  }

  async function save(next: ReminderSettings) {
    const result = await saveSettings({ ...next, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || next.time_zone });
    if (result.error) setMessage(result.error);
    else setSaved(true);
  }

  const update = (patch: Partial<ReminderSettings>) => {
    setSaved(false);
    setSettings((s) => ({ ...s, ...patch }));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-rose-900">Reminders</h1>
      <InstallTip />

      <section className="card space-y-3">
        {status === "checking" && <p className="text-stone-600">Checking this device…</p>}
        {status === "needs-install" && (
          <p className="text-stone-700">
            On iPhone, notifications only work once Nourish is on your Home Screen. Follow the steps above, then open
            Nourish from the Home Screen and come back here.
          </p>
        )}
        {status === "unsupported" && (
          <p className="text-stone-700">This browser can&apos;t show notifications. On iPhone, update to iOS 16.4 or newer.</p>
        )}
        {status === "denied" && (
          <p className="text-stone-700">
            Notifications are blocked. On iPhone go to Settings → Notifications → Nourish and turn on Allow Notifications.
          </p>
        )}
        {status === "off" && (
          <>
            <p className="text-stone-700">Gentle nudges to eat, check in and weigh in. You choose which ones and when.</p>
            <button className="btn-primary w-full" onClick={turnOn} disabled={busy}>
              {busy ? "Turning on…" : "Turn on reminders"}
            </button>
          </>
        )}
        {status === "on" && (
          <>
            <p className="font-medium text-emerald-700">Reminders are on for this device ✓</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={test} disabled={busy}>
                Send a test
              </button>
              <button className="btn-secondary flex-1" onClick={turnOff} disabled={busy}>
                Turn off
              </button>
            </div>
          </>
        )}
        {message && <p className="text-sm text-stone-700">{message}</p>}
      </section>

      <section className="card space-y-5">
        <Toggle
          label="Snack nudges"
          help="Only sent if you haven't logged food in the last 2½ hours."
          checked={settings.meal_nudges}
          onChange={(v) => update({ meal_nudges: v })}
        >
          <div className="flex flex-wrap items-center gap-2">
            {settings.meal_times.map((t, i) => (
              <span key={i} className="flex items-center gap-1">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => update({ meal_times: settings.meal_times.map((x, j) => (j === i ? e.target.value : x)) })}
                  className="input w-32"
                />
                <button
                  type="button"
                  aria-label="Remove time"
                  className="px-1 text-stone-400"
                  onClick={() => update({ meal_times: settings.meal_times.filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              </span>
            ))}
            {settings.meal_times.length < 6 && (
              <button type="button" className="text-sm text-rose-800 underline" onClick={() => update({ meal_times: [...settings.meal_times, "12:30"] })}>
                + Add time
              </button>
            )}
          </div>
        </Toggle>

        <Toggle label="Evening check-in" help="Skipped if you've already checked in." checked={settings.checkin} onChange={(v) => update({ checkin: v })}>
          <input type="time" value={settings.checkin_time} onChange={(e) => update({ checkin_time: e.target.value })} className="input w-32" />
        </Toggle>

        <Toggle label="Weekly weigh-in" checked={settings.weigh_in} onChange={(v) => update({ weigh_in: v })}>
          <DayTime
            day={settings.weigh_in_day}
            time={settings.weigh_in_time}
            onChange={(day, time) => update({ weigh_in_day: day, weigh_in_time: time })}
          />
        </Toggle>

        <Toggle label="Weekly summary" checked={settings.weekly_summary} onChange={(v) => update({ weekly_summary: v })}>
          <DayTime
            day={settings.summary_day}
            time={settings.summary_time}
            onChange={(day, time) => update({ summary_day: day, summary_time: time })}
          />
        </Toggle>

        <button className="btn-primary w-full" onClick={() => save(settings)}>
          {saved ? "Saved ✓" : "Save reminder times"}
        </button>
      </section>
    </div>
  );
}

function Toggle({
  label,
  help,
  checked,
  onChange,
  children,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="font-medium text-stone-900">{label}</span>
          {help && <span className="block text-sm text-stone-500">{help}</span>}
        </span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-rose-700" />
      </label>
      {checked && <div className="mt-2">{children}</div>}
    </div>
  );
}

function DayTime({ day, time, onChange }: { day: number; time: string; onChange: (day: number, time: string) => void }) {
  return (
    <div className="flex gap-2">
      <select value={day} onChange={(e) => onChange(Number(e.target.value), time)} className="input flex-1">
        {DAYS.map((d, i) => (
          <option key={d} value={i}>
            {d}
          </option>
        ))}
      </select>
      <input type="time" value={time} onChange={(e) => onChange(day, e.target.value)} className="input w-32" />
    </div>
  );
}
