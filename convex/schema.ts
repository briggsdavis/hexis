import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Database schema for Hexis.
 *
 * Two core tables:
 *  - `habits`        the habits a user wants to build.
 *  - `completions`   one row per day a habit is marked done.
 *
 * Auth is intentionally left out of the scaffold. Once you wire up a Convex
 * auth provider, add a `userId` field to `habits` and scope every query by it.
 */
export default defineSchema({
  habits: defineTable({
    name: v.string(),
    // Optional short description or motivation.
    description: v.optional(v.string()),
    // A color used to render the habit in the UI (hex or tailwind token).
    color: v.string(),
    // An emoji or icon name shown next to the habit.
    icon: v.optional(v.string()),
    // How often the habit should be done.
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
    ),
    // Whether the habit is currently active (vs. archived).
    archived: v.boolean(),
    // Sort order for display.
    order: v.number(),
  }).index("by_archived", ["archived"]),

  completions: defineTable({
    habitId: v.id("habits"),
    // The local calendar day this completion is for, stored as "YYYY-MM-DD".
    date: v.string(),
  })
    .index("by_habit", ["habitId"])
    .index("by_habit_and_date", ["habitId", "date"])
    .index("by_date", ["date"]),
});
