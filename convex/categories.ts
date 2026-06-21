import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/auth";

const MAX_TOP_LEVEL = 20; // PRD §5

/** All categories for the user (active + archived), ordered. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return categories.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    icon: v.string(),
    parentId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Enforce the 20 top-level category cap.
    if (!args.parentId) {
      const topLevel = await ctx.db
        .query("categories")
        .withIndex("by_user_and_parent", (q) =>
          q.eq("userId", userId).eq("parentId", undefined),
        )
        .collect();
      if (topLevel.filter((c) => !c.archived).length >= MAX_TOP_LEVEL) {
        throw new Error(`You can have at most ${MAX_TOP_LEVEL} categories.`);
      }
    }

    const siblings = await ctx.db
      .query("categories")
      .withIndex("by_user_and_parent", (q) =>
        q.eq("userId", userId).eq("parentId", args.parentId),
      )
      .collect();

    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      color: args.color,
      icon: args.icon,
      parentId: args.parentId,
      order: siblings.length,
      archived: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    const category = await ctx.db.get(id);
    if (!category || category.userId !== userId) throw new Error("Not found");

    const fields = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(id, fields);
  },
});

/** Reorder categories within a parent (drag-and-drop, PRD §5). */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("categories")) },
  handler: async (ctx, { orderedIds }) => {
    const userId = await requireUser(ctx);
    await Promise.all(
      orderedIds.map(async (id, index) => {
        const cat = await ctx.db.get(id);
        if (cat && cat.userId === userId) {
          await ctx.db.patch(id, { order: index });
        }
      }),
    );
  },
});

export const archive = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const category = await ctx.db.get(id);
    if (!category || category.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { archived: true });
    // Archive subcategories too.
    const subs = await ctx.db
      .query("categories")
      .withIndex("by_user_and_parent", (q) =>
        q.eq("userId", userId).eq("parentId", id),
      )
      .collect();
    await Promise.all(subs.map((s) => ctx.db.patch(s._id, { archived: true })));
  },
});

export const restore = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const category = await ctx.db.get(id);
    if (!category || category.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { archived: false });
  },
});
