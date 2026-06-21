import { Doc } from "../_generated/dataModel";
import { addDays } from "./dates";
import { completionRatio, isScheduledOn } from "./scheduling";

/**
 * Compute current and longest streak for a habit (PRD §11).
 *
 * Streaks are based on successful *scheduled occurrences*, not calendar days:
 *  - A scheduled day counts toward the streak when completed (ratio === 1).
 *  - A scheduled day that is missed resets the streak.
 *  - Paused days / non-scheduled days are skipped entirely.
 *
 * `valueByDate` maps "YYYY-MM-DD" -> recorded value for this habit.
 */
export function computeStreaks(
  habit: Doc<"habits">,
  valueByDate: Map<string, number>,
  today: string,
): { current: number; longest: number } {
  const startKey = habitStartDate(habit);

  let longest = 0;
  let running = 0;
  let current = 0;

  for (let key = startKey; key <= today; key = addDays(key, 1)) {
    if (!isScheduledOn(habit.schedule, key)) continue;

    const done = completionRatio(habit, valueByDate.get(key)) >= 1;
    if (done) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      // A missed scheduled occurrence breaks the streak. Today is excused if
      // not yet completed — the day isn't over.
      if (key !== today) running = 0;
    }
    current = running;
  }

  return { current, longest };
}

function habitStartDate(habit: Doc<"habits">): string {
  const d = new Date(habit.createdAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
