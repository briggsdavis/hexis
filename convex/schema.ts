import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * HabitFlow database schema.
 *
 * Everything is scoped to a single authenticated user via `userId`. Auth tables
 * (users, sessions, …) come from Convex Auth via `authTables`.
 */

// Reusable validators -------------------------------------------------------

export const scheduleValidator = v.object({
  // How the habit recurs (PRD §10).
  type: v.union(
    v.literal("daily"),
    v.literal("weekdays"),
    v.literal("weekends"),
    v.literal("custom"),
  ),
  // For "custom": days of week, 0 = Sunday … 6 = Saturday.
  days: v.optional(v.array(v.number())),
});

export const habitTypeValidator = v.union(
  v.literal("checkbox"),
  v.literal("quantitative"),
  v.literal("goal"),
);

// A "goal" is a longer-horizon target (PRD: Goals). It is one of:
//  - "streak": do the same action for `goalTargetDays` days, tolerating up to
//    `goalAllowedSkips` missed days before the run resets.
//  - "progressive": accumulate logged values toward `goalTargetValue`.
export const goalModeValidator = v.union(
  v.literal("streak"),
  v.literal("progressive"),
);

export const inputModeValidator = v.union(
  v.literal("numeric"),
  v.literal("increment"),
);

// Which kind of account a user created (chosen at sign-up, fixed afterward).
//  - "productivity": the original habit/goal tracker.
//  - "weightLoss": a calorie-deficit tracker with a cumulative goal + vial.
export const accountTypeValidator = v.union(
  v.literal("productivity"),
  v.literal("weightLoss"),
);

// Schema --------------------------------------------------------------------

export default defineSchema({
  ...authTables,

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(), // hex
    icon: v.string(), // lucide icon name
    order: v.number(),
    // null/undefined parent => top-level category; otherwise a subcategory.
    parentId: v.optional(v.id("categories")),
    archived: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_parent", ["userId", "parentId"]),

  habits: defineTable({
    userId: v.id("users"),
    categoryId: v.id("categories"),
    name: v.string(),
    type: habitTypeValidator,

    // Quantitative-only fields.
    goalValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    inputMode: v.optional(inputModeValidator),
    incrementStep: v.optional(v.number()),

    // Goal-only fields (type === "goal").
    goalMode: v.optional(goalModeValidator),
    goalStartDate: v.optional(v.string()), // "YYYY-MM-DD" the goal began
    goalDeadline: v.optional(v.string()), // optional "YYYY-MM-DD" target date
    goalTargetDays: v.optional(v.number()), // streak: days required
    goalAllowedSkips: v.optional(v.number()), // streak: tolerated misses per run
    goalTargetValue: v.optional(v.number()), // progressive: cumulative target

    schedule: scheduleValidator,
    paused: v.boolean(),
    deleted: v.boolean(), // soft delete (PRD §16)
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_category", ["userId", "categoryId"]),

  // One row per habit per day that has any progress recorded.
  completions: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.string(), // local day "YYYY-MM-DD"
    // checkbox: 0 or 1. quantitative: the recorded amount (may exceed goal).
    value: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_habit", ["habitId"])
    .index("by_habit_and_date", ["habitId", "date"]),

  // One row per user. Records which kind of account they created and, for
  // weight-loss accounts, the cumulative calorie goal the vial fills toward.
  accounts: defineTable({
    userId: v.id("users"),
    accountType: accountTypeValidator,
    calorieGoal: v.optional(v.number()), // weightLoss: cumulative calories to burn
  }).index("by_user", ["userId"]),

  // One row per day a weight-loss user logs. `net` is signed:
  //   net > 0 = deficit (progress toward the goal)
  //   net < 0 = surplus (reduces progress by that amount)
  //   net === 0 = neutral day
  calorieEntries: defineTable({
    userId: v.id("users"),
    date: v.string(), // local day "YYYY-MM-DD"
    net: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // One-time tasks (PRD §6.2). Not tied to categories.
  tasks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    createdDate: v.string(), // day the task was created
    completed: v.boolean(),
    completedDate: v.optional(v.string()), // day it was completed (pins it there)
    order: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_completed", ["userId", "completed"]),
});
