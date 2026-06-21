import { Doc } from "../_generated/dataModel";
import { dayOfWeek } from "./dates";

type Schedule = Doc<"habits">["schedule"];

/** Is the habit scheduled to occur on the given date key? */
export function isScheduledOn(schedule: Schedule, dateKey: string): boolean {
  const dow = dayOfWeek(dateKey); // 0=Sun … 6=Sat
  switch (schedule.type) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "custom":
      return schedule.days?.includes(dow) ?? false;
  }
}

/** Completion ratio (0..1, capped) for a single habit on a day. */
export function completionRatio(
  habit: Doc<"habits">,
  value: number | undefined,
): number {
  if (value === undefined) return 0;
  if (habit.type === "checkbox") {
    return value >= 1 ? 1 : 0;
  }
  const goal = habit.goalValue ?? 0;
  if (goal <= 0) return value > 0 ? 1 : 0;
  return Math.min(value / goal, 1);
}

/** Amount recorded beyond the goal (overachievement, PRD §9). */
export function overachievement(
  habit: Doc<"habits">,
  value: number | undefined,
): number {
  if (habit.type !== "quantitative" || value === undefined) return 0;
  const goal = habit.goalValue ?? 0;
  return Math.max(value - goal, 0);
}
