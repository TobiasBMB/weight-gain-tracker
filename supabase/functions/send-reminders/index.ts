// Sends due reminder notifications. Called every 15 minutes by pg_cron (with x-cron-secret),
// by a signed-in user with {"test": true} to send themselves a test notification,
// or with {"publicKey": true} to fetch the VAPID public key for subscribing.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.0";
import webpush from "npm:web-push@3.6.7";

const APP_URL = "https://weight-gain-tracker-mocha.vercel.app";
const WINDOW_MINUTES = 45;

type Settings = {
  user_id: string;
  time_zone: string;
  meal_nudges: boolean;
  meal_times: string[];
  checkin: boolean;
  checkin_time: string;
  weigh_in: boolean;
  weigh_in_day: number;
  weigh_in_time: string;
  weekly_summary: boolean;
  summary_day: number;
  summary_time: string;
};

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };
type Message = { kind: string; title: string; body: string; url: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function localParts(tz: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const y = Number(get("year")), m = Number(get("month")), d = Number(get("day"));
  const h = Number(get("hour")), min = Number(get("minute")), s = Number(get("second"));
  const offsetMs = Date.UTC(y, m - 1, d, h, min, s) - Math.floor(at.getTime() / 1000) * 1000;
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
    minutes: h * 60 + min,
    // UTC instant of local midnight today
    dayStart: new Date(Date.UTC(y, m - 1, d) - offsetMs),
  };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const isDue = (now: number, at: string) => now >= toMinutes(at) && now < toMinutes(at) + WINDOW_MINUTES;

async function dueMessages(db: SupabaseClient, s: Settings): Promise<Message[]> {
  const now = localParts(s.time_zone);
  const out: Message[] = [];

  if (s.meal_nudges) {
    for (const t of s.meal_times) {
      if (!isDue(now.minutes, t)) continue;
      const recent = new Date(Date.now() - 150 * 60 * 1000).toISOString();
      const { count } = await db
        .from("food_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", s.user_id)
        .gte("eaten_at", recent);
      if (count) continue;
      const { data: today } = await db
        .from("food_logs")
        .select("calories")
        .eq("user_id", s.user_id)
        .gte("eaten_at", now.dayStart.toISOString());
      const kcal = (today ?? []).reduce((a, f) => a + (f.calories ?? 0), 0);
      out.push({
        kind: `meal_${t.slice(0, 5)}`,
        title: "Snack time 🍌",
        body: kcal
          ? `You're on ${kcal} kcal so far today. A snack now keeps you on track.`
          : "Nothing logged yet today. Have something small and log it.",
        url: "/today",
      });
    }
  }

  if (s.checkin && isDue(now.minutes, s.checkin_time)) {
    const { count } = await db
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", s.user_id)
      .eq("day", now.day);
    if (!count) {
      out.push({ kind: "checkin", title: "How was today?", body: "20-second check-in: stress, skin and sleep.", url: "/today" });
    }
  }

  if (s.weigh_in && now.weekday === s.weigh_in_day && isDue(now.minutes, s.weigh_in_time)) {
    const { data } = await db.from("checkins").select("weight_kg").eq("user_id", s.user_id).eq("day", now.day).maybeSingle();
    if (!data?.weight_kg) {
      out.push({ kind: "weigh_in", title: "Weekly weigh-in ⚖️", body: "Weigh yourself before breakfast and log it.", url: "/today" });
    }
  }

  if (s.weekly_summary && now.weekday === s.summary_day && isDue(now.minutes, s.summary_time)) {
    const since = new Date(now.dayStart.getTime() - 6 * 86400000).toISOString();
    const { data } = await db.from("food_logs").select("eaten_at, calories, protein_g").eq("user_id", s.user_id).gte("eaten_at", since);
    const byDay = new Map<string, { kcal: number; protein: number }>();
    for (const f of data ?? []) {
      const d = localParts(s.time_zone, new Date(f.eaten_at)).day;
      const cur = byDay.get(d) ?? { kcal: 0, protein: 0 };
      cur.kcal += f.calories ?? 0;
      cur.protein += Number(f.protein_g ?? 0);
      byDay.set(d, cur);
    }
    const days = [...byDay.values()];
    const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
    out.push({
      kind: "summary",
      title: "Your week in Nourish",
      body: days.length
        ? `${days.length} days logged, averaging ${avg(days.map((d) => d.kcal))} kcal and ${avg(days.map((d) => d.protein))} g protein. Tap to refresh your plan.`
        : "No food logged this week. Even a few days of logging helps your plan.",
      url: "/plan",
    });
  }

  return out;
}

/** VAPID keys live only in app_secrets. Generated on first use so the private key never leaves Supabase. */
async function loadVapidKeys(db: SupabaseClient) {
  const read = async () => {
    const { data, error } = await db.from("app_secrets").select("name, value").in("name", ["vapid_public_key", "vapid_private_key"]);
    if (error) throw error;
    const get = (n: string) => data?.find((r) => r.name === n)?.value as string | undefined;
    const publicKey = get("vapid_public_key"), privateKey = get("vapid_private_key");
    return publicKey && privateKey ? { publicKey, privateKey } : null;
  };
  try {
    const existing = await read();
    if (existing) return existing;
    const keys = webpush.generateVAPIDKeys();
    await db.from("app_secrets").upsert(
      [
        { name: "vapid_public_key", value: keys.publicKey },
        { name: "vapid_private_key", value: keys.privateKey },
      ],
      { onConflict: "name", ignoreDuplicates: true },
    );
    return await read();
  } catch (err) {
    console.error("vapid keys", err);
    return null;
  }
}

async function send(db: SupabaseClient, subs: Sub[], msg: Omit<Message, "kind"> & { tag: string }) {
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: msg.title, body: msg.body, url: msg.url, tag: msg.tag }),
        { TTL: 3600 },
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("push failed", status, (err as Error).message);
      }
    }
  }
  return sent;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const vapid = await loadVapidKeys(db);
  if (!vapid) return json({ error: "config unavailable" }, 500);
  webpush.setVapidDetails(APP_URL, vapid.publicKey, vapid.privateKey);

  const body = await req.json().catch(() => ({}));

  if (body?.publicKey) return json({ publicKey: vapid.publicKey });

  // Test notification for the signed-in user.
  if (body?.test) {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const { data: auth } = await db.auth.getUser(token);
    if (!auth.user) return json({ error: "Please sign in again." }, 401);
    const { data: subs } = await db.from("push_subscriptions").select("*").eq("user_id", auth.user.id);
    if (!subs?.length) return json({ error: "Notifications aren't turned on for this device yet." }, 400);
    const sent = await send(db, subs as Sub[], {
      title: "Nourish reminders are on ✅",
      body: "This is what your reminders will look like.",
      url: "/today",
      tag: "test",
    });
    return json({ sent });
  }

  const { data: cron } = await db.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  if (!cron?.value || req.headers.get("x-cron-secret") !== cron.value) return json({ error: "unauthorised" }, 401);

  const [{ data: settings }, { data: subs }] = await Promise.all([
    db.from("reminder_settings").select("*"),
    db.from("push_subscriptions").select("*"),
  ]);

  let sent = 0;
  for (const s of (settings ?? []) as Settings[]) {
    const userSubs = ((subs ?? []) as Sub[]).filter((x) => x.user_id === s.user_id);
    if (!userSubs.length) continue;
    const day = localParts(s.time_zone).day;
    for (const msg of await dueMessages(db, s)) {
      // Claim the reminder first so overlapping runs can't double-send.
      const { data: claimed } = await db
        .from("push_log")
        .upsert({ user_id: s.user_id, kind: msg.kind, sent_on: day }, { onConflict: "user_id,kind,sent_on", ignoreDuplicates: true })
        .select("id");
      if (!claimed?.length) continue;
      sent += await send(db, userSubs, { ...msg, tag: msg.kind });
    }
  }
  return json({ sent });
});
