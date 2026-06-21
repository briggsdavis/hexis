/** Small date helpers. All dates are handled as local-day "YYYY-MM-DD" strings. */

/** Format a Date as a local "YYYY-MM-DD" string. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** The "YYYY-MM-DD" key for the current local day. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Return the last `n` day-keys ending today, oldest first. */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const cursor = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}
