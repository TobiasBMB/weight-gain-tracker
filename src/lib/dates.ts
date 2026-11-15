export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "Australia/Sydney";

/** YYYY-MM-DD for the given instant in the app's time zone. */
export function dayKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Offset of TIME_ZONE from UTC at the given instant, in minutes. */
function offsetMinutes(at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** UTC instant for local midnight at the start of the given YYYY-MM-DD day. */
export function startOfDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  return new Date(guess.getTime() - offsetMinutes(guess) * 60000);
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** UTC instant for a local YYYY-MM-DD + HH:MM in the app's time zone. */
export function localDateTime(day: string, time: string) {
  const [h, min] = time.split(":").map(Number);
  const base = startOfDay(day);
  return new Date(base.getTime() + (h * 60 + min) * 60000);
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(day: string) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}
