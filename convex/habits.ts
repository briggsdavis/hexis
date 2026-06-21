import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";
import {
  habitTypeValidator,
  inputModeValidator,
  scheduleValidator,
} from "./schema";

/** All non-deleted habits for the user. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return habits
      .filter((h) => !h.deleted)
      .sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    type: habitTypeValidator,
    goalValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    inputMode: v.optional(inputModeValidator),
    incrementStep: v.optional(v.number()),
    schedule: scheduleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_and_category", (q) =>
        q.eq("userId", userId).eq("categoryId", args.categoryId),
      )
      .collect();

    return await ctx.db.insert("habits", {
      userId,
      ...args,
      paused: false,
      deleted: false,
      order: existing.length,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    categoryId: v.optional(v.id("categories")),
    name: v.optional(v.string()),
    goalValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    inputMode: v.optional(inputModeValidator),
    incrementStep: v.optional(v.number()),
    schedule: v.optional(scheduleValidator),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");

    const fields = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, fields);
  },
});

/** Pause or resume a habit (PRD §10). */
export const setPaused = mutation({
  args: { id: v.id("habits"), paused: v.boolean() },
  handler: async (ctx, { id, paused }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { paused });
  },
});

/** Soft delete (PRD §16): hide from dashboards, keep all history. */
export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const habit = await ctx.db.get(id);
    if (!habit || habit.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { deleted: true });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("habits")) },
  handler: async (ctx, { orderedIds }) => {
    const userId = await requireUser(ctx);
    await Promise.all(
      orderedIds.map(async (id, index) => {
        const habit = await ctx.db.get(id);
        if (habit && habit.userId === userId) {
          await ctx.db.patch(id, { order: index });
        }
      }),
    );
  },
});
