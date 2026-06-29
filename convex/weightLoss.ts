import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { addDays } from "./lib/dates";

/**
 * Weight-loss tracker backend.
 *
 * The vial fills toward a single cumulative `calorieGoal`. Each day the user
 * logs a signed `net` value (deficit > 0, surplus < 0). Total progress is the
 * sum of every day's net, clamped to [0, goal] — so a string of surpluses can
 * only ever empty the vial, never push it negative, and a huge deficit can't
 * overflow it past 100%.
 */

async function getAccount(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("accounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

/** Set / update the cumulative calorie goal. Editable at any time. */
export const setGoal = mutation({
  args: { goal: v.number() },
  handler: async (ctx, { goal }) => {
    const userId = await requireUser(ctx);
    const clamped = Math.max(0, Math.round(goal));
    const account = await getAccount(ctx, userId);
    if (account) {
      await ctx.db.patch(account._id, {
        calorieGoal: clamped,
        accountType: "weightLoss",
      });
    } else {
      await ctx.db.insert("accounts", {
        userId,
        accountType: "weightLoss",
        calorieGoal: clamped,
      });
    }
  },
});

/** Record (or overwrite) the net calories for a single day. */
export const setEntry = mutation({
  args: { date: v.string(), net: v.number() },
  handler: async (ctx, { date, net }) => {
    const userId = await requireUser(ctx);
    const value = Math.round(net);
    const existing = await ctx.db
      .query("calorieEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", date),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { net: value });
    } else {
      await ctx.db.insert("calorieEntries", { userId, date, net: value });
    }
  },
});

/** Vial data: goal, running total (clamped), percentage, and today's entry. */
export const summary = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const account = await getAccount(ctx, userId);
    const goal = account?.calorieGoal ?? 0;

    const entries = await ctx.db
      .query("calorieEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let rawTotal = 0;
    let todayNet: number | null = null;
    for (const e of entries) {
      rawTotal += e.net;
      if (e.date === date) todayNet = e.net;
    }

    const total = Math.max(0, Math.min(goal, rawTotal));
    const percent = goal > 0 ? total / goal : 0;

    return {
      goal,
      rawTotal,
      total,
      percent,
      reached: goal > 0 && rawTotal >= goal,
      todayNet,
    };
  },
});

/**
 * The last `days` days ending at `end` (inclusive), most-recent first. Each day
 * carries its net and whether an entry exists, so the history view can render
 * green (deficit) / red (surplus) / light-green (no entry or zero).
 */
export const history = query({
  args: { end: v.string(), days: v.number() },
  handler: async (ctx, { end, days }) => {
    const userId = await requireUser(ctx);
    const entries = await ctx.db
      .query("calorieEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const byDate = new Map<string, number>();
    for (const e of entries) byDate.set(e.date, e.net);

    const out: { date: string; net: number; hasEntry: boolean }[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(end, -i);
      const net = byDate.get(date);
      out.push({ date, net: net ?? 0, hasEntry: net !== undefined });
    }
    return out;
  },
});
