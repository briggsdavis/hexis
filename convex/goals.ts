import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { Doc } from "./_generated/dataModel";
import { addDays, formatDate } from "./lib/dates";

/**
 * Goals are a special habit `type === "goal"`. Two modes:
 *  - streak: complete the same action for `goalTargetDays` days, tolerating up
 *    to `goalAllowedSkips` missed days before the current run resets.
 *  - progressive: accumulate daily logged values toward `goalTargetValue`.
 *
 * Daily logging reuses the `completions` table (value 1 = done for streaks,
 * value = the logged amount for progressive). Goals are intentionally excluded
 * from the daily completion rings/analytics — they live on their own horizon.
 */

function startDateOf(goal: Doc<"habits">): string {
  if (goal.goalStartDate) return goal.goalStartDate;
  return formatDate(new Date(goal.createdAt));
}

function computeStreakGoal(
  goal: Doc<"habits">,
  valueByDate: Map<string, number>,
  today: string,
) {
  const target = goal.goalTargetDays ?? 0;
  const allowedSkips = goal.goalAllowedSkips ?? 0;
  const start = startDateOf(goal);

  let run = 0;
  let skipsUsed = 0;
  let best = 0;

  for (let key = start; key <= today; key = addDays(key, 1)) {
    const done = (valueByDate.get(key) ?? 0) >= 1;
    if (done) {
      run += 1;
      best = Math.max(best, run);
    } else if (key === today) {
      // Today isn't over yet — don't penalise an as-yet-unlogged day.
      continue;
    } else if (skipsUsed < allowedSkips) {
      skipsUsed += 1; // tolerated miss: run survives but doesn't advance
    } else {
      run = 0;
      skipsUsed = 0;
    }
  }

  const completed = best >= target && target > 0;
  return {
    current: run,
    best,
    target,
    allowedSkips,
    skipsLeft: Math.max(0, allowedSkips - skipsUsed),
    ratio: target > 0 ? Math.min(run / target, 1) : 0,
    completed,
    doneToday: (valueByDate.get(today) ?? 0) >= 1,
  };
}

function computeProgressiveGoal(
  goal: Doc<"habits">,
  valueByDate: Map<string, number>,
  today: string,
) {
  const target = goal.goalTargetValue ?? 0;
  const start = startDateOf(goal);

  let sum = 0;
  for (const [date, value] of valueByDate) {
    if (date >= start && date <= today) sum += value;
  }

  const ratio = target > 0 ? Math.min(sum / target, 1) : 0;
  const completed = target > 0 && sum >= target;

  // Optional deadline → simple pace projection.
  let projection:
    | { onTrack: boolean; expected: number; perDayNeeded: number; daysLeft: number }
    | undefined;
  if (goal.goalDeadline && goal.goalDeadline >= start) {
    let totalDays = 0;
    for (let k = start; k <= goal.goalDeadline; k = addDays(k, 1)) totalDays += 1;
    let elapsed = 0;
    for (let k = start; k <= today && k <= goal.goalDeadline; k = addDays(k, 1))
      elapsed += 1;
    const expected = totalDays > 0 ? target * (elapsed / totalDays) : 0;
    let daysLeft = 0;
    for (let k = addDays(today, 1); k <= goal.goalDeadline; k = addDays(k, 1))
      daysLeft += 1;
    const remaining = Math.max(0, target - sum);
    projection = {
      onTrack: sum >= expected,
      expected,
      perDayNeeded: daysLeft > 0 ? remaining / daysLeft : remaining,
      daysLeft,
    };
  }

  return {
    sum,
    target,
    ratio,
    completed,
    todayValue: valueByDate.get(today) ?? 0,
    projection,
  };
}

/** All active goals with computed progress. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const today = formatDate(new Date());

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const goals = habits.filter((h) => !h.deleted && h.type === "goal");

    return await Promise.all(
      goals.map(async (goal) => {
        const completions = await ctx.db
          .query("completions")
          .withIndex("by_habit", (q) => q.eq("habitId", goal._id))
          .collect();
        const valueByDate = new Map<string, number>();
        for (const c of completions) valueByDate.set(c.date, c.value);

        const mode = goal.goalMode ?? "streak";
        return {
          habitId: goal._id,
          categoryId: goal.categoryId,
          name: goal.name,
          mode,
          unit: goal.unit,
          inputMode: goal.inputMode,
          incrementStep: goal.incrementStep,
          deadline: goal.goalDeadline,
          startDate: startDateOf(goal),
          streak:
            mode === "streak"
              ? computeStreakGoal(goal, valueByDate, today)
              : undefined,
          progressive:
            mode === "progressive"
              ? computeProgressiveGoal(goal, valueByDate, today)
              : undefined,
        };
      }),
    );
  },
});
