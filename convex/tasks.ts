import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

/**
 * One-time tasks (PRD §6.2).
 *
 * Carry-forward behavior: an incomplete task shows on every day until it is
 * completed. Once completed it is pinned to its `completedDate`.
 */

/** Tasks to show on a given day: still-incomplete ones + ones completed today. */
export const listForDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await requireUser(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return tasks
      .filter(
        (t) =>
          (!t.completed && t.createdDate <= date) ||
          (t.completed && t.completedDate === date),
      )
      .sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: { name: v.string(), date: v.string() },
  handler: async (ctx, { name, date }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return await ctx.db.insert("tasks", {
      userId,
      name,
      createdDate: date,
      completed: false,
      order: existing.length,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new Error("Not found");

    if (task.completed) {
      await ctx.db.patch(id, { completed: false, completedDate: undefined });
    } else {
      await ctx.db.patch(id, { completed: true, completedDate: date });
    }
  },
});

export const rename = mutation({
  args: { id: v.id("tasks"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { name });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
