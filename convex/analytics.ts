import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import { Doc, Id } from "./_generated/dataModel";
import { completionRatio, isScheduledOn } from "./lib/scheduling";
import { computeStreaks } from "./lib/streaks";
import { addDays, dateRange } from "./lib/dates";

// ---------------------------------------------------------------------------
// Shared loading + per-day computation
// ---------------------------------------------------------------------------

type Loaded = {
  habits: Doc<"habits">[];
  categories: Doc<"categories">[];
  // habitId -> (date -> value)
  values: Map<string, Map<string, number>>;
};

async function loadAll(ctx: any, userId: Id<"users">): Promise<Loaded> {
  const [habits, categories, completions] = await Promise.all([
    ctx.db
      .query("habits")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("categories")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("completions")
      .withIndex("by_user_and_date", (q: any) => q.eq("userId", userId))
      .collect(),
  ]);

  const values = new Map<string, Map<string, number>>();
  for (const c of completions as Doc<"completions">[]) {
    let m = values.get(c.habitId);
    if (!m) {
      m = new Map();
      values.set(c.habitId, m);
    }
    m.set(c.date, c.value);
  }

  return {
    habits: (habits as Doc<"habits">[]).filter((h) => !h.deleted),
    categories: categories as Doc<"categories">[],
    values,
  };
}

/** Habits that count toward completion on a given date. */
function activeOn(habits: Doc<"habits">[], date: string): Doc<"habits">[] {
  return habits.filter(
    (h) => !h.paused && isScheduledOn(h.schedule, date),
  );
}

function valueFor(loaded: Loaded, habitId: string, date: string) {
  return loaded.values.get(habitId)?.get(date);
}

/** Overall + per-category completion (0..1) for a single day. */
function dayCompletion(loaded: Loaded, date: string) {
  const scheduled = activeOn(loaded.habits, date);

  let total = 0;
  let completedCount = 0;
  const byCategory = new Map<string, { sum: number; count: number }>();

  for (const habit of scheduled) {
    const ratio = completionRatio(habit, valueFor(loaded, habit._id, date));
    total += ratio;
    if (ratio >= 1) completedCount += 1;

    const key = habit.categoryId as string;
    const agg = byCategory.get(key) ?? { sum: 0, count: 0 };
    agg.sum += ratio;
    agg.count += 1;
    byCategory.set(key, agg);
  }

  const overall = scheduled.length === 0 ? 0 : total / scheduled.length;

  const categories = Array.from(byCategory.entries()).map(([id, agg]) => ({
    categoryId: id,
    completion: agg.count === 0 ? 0 : agg.sum / agg.count,
  }));

  return {
    overall,
    categories,
    scheduledCount: scheduled.length,
    completedCount,
    missedCount: scheduled.length - completedCount,
  };
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

/** Right-sidebar progress panel data for the selected day (PRD §12–13). */
export const dayProgress = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);
    const day = dayCompletion(loaded, date);

    const categoryRings = loaded.categories
      .filter((c) => !c.archived && !c.parentId)
      .map((c) => {
        const match = day.categories.find((d) => d.categoryId === c._id);
        return {
          categoryId: c._id,
          name: c.name,
          color: c.color,
          completion: match?.completion ?? 0,
        };
      });

    return {
      overall: day.overall,
      completedCount: day.completedCount,
      scheduledCount: day.scheduledCount,
      categoryRings,
    };
  },
});

/** Aggregate completion across a period for the period toggle (PRD §12). */
export const periodProgress = query({
  args: { start: v.string(), end: v.string() },
  handler: async (ctx, { start, end }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);

    const days = dateRange(start, end);
    let sum = 0;
    let counted = 0;
    for (const d of days) {
      const day = dayCompletion(loaded, d);
      if (day.scheduledCount > 0) {
        sum += day.overall;
        counted += 1;
      }
    }
    return { overall: counted === 0 ? 0 : sum / counted, days: counted };
  },
});

/** Per-day completion for a calendar month (PRD §14.1). */
export const calendar = query({
  args: { start: v.string(), end: v.string() },
  handler: async (ctx, { start, end }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);

    return dateRange(start, end).map((date) => {
      const day = dayCompletion(loaded, date);
      return {
        date,
        completion: day.overall,
        completedCount: day.completedCount,
        missedCount: day.missedCount,
        scheduledCount: day.scheduledCount,
      };
    });
  },
});

/** Full detail for the day drawer (PRD §14.2). */
export const dayDetail = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);
    const scheduled = activeOn(loaded.habits, date);

    const completed: any[] = [];
    const missed: any[] = [];
    for (const habit of scheduled) {
      const value = valueFor(loaded, habit._id, date);
      const ratio = completionRatio(habit, value);
      const entry = {
        habitId: habit._id,
        name: habit.name,
        categoryId: habit.categoryId,
        value: value ?? 0,
        goalValue: habit.goalValue,
        ratio,
      };
      (ratio >= 1 ? completed : missed).push(entry);
    }

    const day = dayCompletion(loaded, date);
    const categoryBreakdown = loaded.categories
      .filter((c) => !c.parentId)
      .map((c) => ({
        categoryId: c._id,
        name: c.name,
        color: c.color,
        completion:
          day.categories.find((d) => d.categoryId === c._id)?.completion ?? 0,
      }))
      .filter((c) =>
        scheduled.some((h) => (h.categoryId as string) === c.categoryId),
      );

    return {
      date,
      overall: day.overall,
      completed,
      missed,
      categoryBreakdown,
    };
  },
});

/** Overview cards on the analytics page (PRD §15). */
export const overview = query({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);

    const avgOverLast = (n: number) => {
      let sum = 0;
      let counted = 0;
      for (let i = 0; i < n; i++) {
        const d = addDays(today, -i);
        const day = dayCompletion(loaded, d);
        if (day.scheduledCount > 0) {
          sum += day.overall;
          counted += 1;
        }
      }
      return counted === 0 ? 0 : sum / counted;
    };

    let currentStreak = 0;
    let longestStreak = 0;
    for (const habit of loaded.habits) {
      const { current, longest } = computeStreaks(
        habit,
        loaded.values.get(habit._id) ?? new Map(),
        today,
      );
      currentStreak = Math.max(currentStreak, current);
      longestStreak = Math.max(longestStreak, longest);
    }

    return {
      current: dayCompletion(loaded, today).overall,
      sevenDayAvg: avgOverLast(7),
      thirtyDayAvg: avgOverLast(30),
      currentStreak,
      longestStreak,
    };
  },
});

/** Daily completion trend series for the analytics line chart (PRD §15). */
export const trend = query({
  args: { start: v.string(), end: v.string() },
  handler: async (ctx, { start, end }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);
    return dateRange(start, end).map((date) => ({
      date,
      completion: Math.round(dayCompletion(loaded, date).overall * 100),
    }));
  },
});

/** Per-habit analytics rows (PRD §15). */
export const habitStats = query({
  args: { today: v.string(), windowDays: v.number() },
  handler: async (ctx, { today, windowDays }) => {
    const userId = await requireUser(ctx);
    const loaded = await loadAll(ctx, userId);
    const days = dateRange(addDays(today, -(windowDays - 1)), today);

    return loaded.habits.map((habit) => {
      const valueMap = loaded.values.get(habit._id) ?? new Map();
      let scheduledDays = 0;
      let completedDays = 0;
      let valueSum = 0;
      let valueDays = 0;

      for (const d of days) {
        if (habit.paused || !isScheduledOn(habit.schedule, d)) continue;
        scheduledDays += 1;
        const value = valueMap.get(d);
        if (completionRatio(habit, value) >= 1) completedDays += 1;
        if (value !== undefined) {
          valueSum += value;
          valueDays += 1;
        }
      }

      const { current, longest } = computeStreaks(habit, valueMap, today);

      return {
        habitId: habit._id,
        name: habit.name,
        categoryId: habit.categoryId,
        type: habit.type,
        completionRate:
          scheduledDays === 0 ? 0 : completedDays / scheduledDays,
        currentStreak: current,
        longestStreak: longest,
        averageValue: valueDays === 0 ? 0 : valueSum / valueDays,
      };
    });
  },
});
