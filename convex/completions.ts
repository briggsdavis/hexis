import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

/**
 * Record / read habit completion values for specific days.
 *
 * Storage convention:
 *  - checkbox habits: value is 0 (incomplete) or 1 (complete).
 *  - quantitative habits: value is the recorded amount (may exceed the goal).
 */

/** All completion rows for the user on a given day. */
export const listForDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("completions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .collect();
  },
});

/** All completion rows for the user across an inclusive date range. */
export const listInRange = query({
  args: { start: v.string(), end: v.string() },
  handler: async (ctx, { start, end }) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("completions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", start).lte("date", end),
      )
      .collect();
  },
});

/** Set a habit's recorded value for a day (upsert). value 0 clears the row. */
export const setValue = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { habitId, date, value }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(habitId);
    if (!habit || habit.userId !== userId) throw new Error("Not found");

    const existing = await ctx.db
      .query("completions")
      .withIndex("by_habit_and_date", (q) =>
        q.eq("habitId", habitId).eq("date", date),
      )
      .unique();

    if (value <= 0) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert("completions", { userId, habitId, date, value });
    }
  },
});

/** Toggle a checkbox habit on a day. Returns the new completed state. */
export const toggle = mutation({
  args: { habitId: v.id("habits"), date: v.string() },
  handler: async (ctx, { habitId, date }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(habitId);
    if (!habit || habit.userId !== userId) throw new Error("Not found");

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
    await ctx.db.insert("completions", { userId, habitId, date, value: 1 });
    return { completed: true };
  },
});
