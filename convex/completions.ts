import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Queries and mutations for tracking habit completions.
 *
 * Dates are stored as "YYYY-MM-DD" strings representing the user's local day.
 */

// Get all completions within a date range (inclusive), e.g. for a calendar.
export const listInRange = query({
  args: { start: v.string(), end: v.string() },
  handler: async (ctx, { start, end }) => {
    return await ctx.db
      .query("completions")
      .withIndex("by_date", (q) => q.gte("date", start).lte("date", end))
      .collect();
  },
});

// Get the set of habit ids completed on a given day.
export const listForDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const completions = await ctx.db
      .query("completions")
      .withIndex("by_date", (q) => q.eq("date", date))
      .collect();
    return completions.map((c) => c.habitId);
  },
});

// Toggle a habit's completion for a given day. Returns the new state.
export const toggle = mutation({
  args: { habitId: v.id("habits"), date: v.string() },
  handler: async (ctx, { habitId, date }) => {
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_habit_and_date", (q) =>
        q.eq("habitId", habitId).eq("date", date),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { completed: false };
    }

    await ctx.db.insert("completions", { habitId, date });
    return { completed: true };
  },
});

// Compute the current daily streak (consecutive days ending today) for a habit.
export const streak = query({
  args: { habitId: v.id("habits"), today: v.string() },
  handler: async (ctx, { habitId, today }) => {
    const completions = await ctx.db
      .query("completions")
      .withIndex("by_habit", (q) => q.eq("habitId", habitId))
      .collect();

    const done = new Set(completions.map((c) => c.date));

    let streak = 0;
    const cursor = new Date(`${today}T00:00:00`);
    // Walk backwards day by day while completions exist.
    while (done.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },
});
