/** Client-side date helpers. Local-day strings formatted "YYYY-MM-DD". */

export function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

export function parseKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function addDays(key: string, delta: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return toKey(d);
}

/** First and last day keys of the month containing `key`. */
export function monthBounds(key: string): { start: string; end: string } {
  const d = parseKey(key);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toKey(start), end: toKey(end) };
}

export function formatLong(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(key: string): string {
  return parseKey(key).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Period range ending today: daily/weekly/monthly/yearly (PRD §12). */
export function periodRange(
  period: "daily" | "weekly" | "monthly" | "yearly",
  today: string,
): { start: string; end: string } {
  switch (period) {
    case "daily":
      return { start: today, end: today };
    case "weekly":
      return { start: addDays(today, -6), end: today };
    case "monthly":
      return { start: addDays(today, -29), end: today };
    case "yearly":
      return { start: addDays(today, -364), end: today };
  }
}
