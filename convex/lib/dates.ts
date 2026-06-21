/**
 * Date helpers shared by the Convex backend. All dates are local-day strings
 * formatted "YYYY-MM-DD". We treat the string itself as the source of truth so
 * server timezone never shifts a user's day.
 */

export function parseDate(key: string): Date {
  // Parse as local midnight to avoid UTC drift.
  return new Date(`${key}T00:00:00`);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Day of week for a date key, 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(key: string): number {
  return parseDate(key).getDay();
}

/** Add (or subtract) days to a date key. */
export function addDays(key: string, delta: number): string {
  const d = parseDate(key);
  d.setDate(d.getDate() + delta);
  return formatDate(d);
}

/** Inclusive list of date keys from start to end. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cursor = start;
  // Guard against accidental infinite loops.
  for (let i = 0; cursor <= end && i < 100000; i++) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}
