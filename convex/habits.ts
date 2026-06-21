import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Queries and mutations for managing habits.
 */

// List all non-archived habits, ordered for display.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .collect();

    return habits.sort((a, b) => a.order - b.order);
  },
});

// Create a new habit.
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_archived", (q) => q.eq("archived", false))
      .collect();
    const order = existing.length;

    return await ctx.db.insert("habits", {
      ...args,
      archived: false,
      order,
    });
  },
});

// Update an existing habit's editable fields.
export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
  },
  handler: async (ctx, { id, ...patch }) => {
    // Drop undefined keys so we only patch what was provided.
    const fields = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, fields);
  },
});

// Archive (soft-delete) a habit.
export const archive = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { archived: true });
  },
});

// Permanently delete a habit and all of its completions.
export const remove = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, { id }) => {
    const completions = await ctx.db
      .query("completions")
      .withIndex("by_habit", (q) => q.eq("habitId", id))
      .collect();
    await Promise.all(completions.map((c) => ctx.db.delete(c._id)));
    await ctx.db.delete(id);
  },
});
