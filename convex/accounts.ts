import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { accountTypeValidator } from "./schema";
import { getUser, requireUser } from "./lib/auth";

/**
 * Account profile: which kind of account the signed-in user created. The type
 * is chosen once at sign-up and is fixed afterward. Weight-loss accounts also
 * carry a cumulative `calorieGoal`. Accounts created before this feature have
 * no row and are treated as "productivity".
 */

/** The current user's account profile, or null (legacy = productivity). */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Create the account profile for the signed-in user. Called right after
 * sign-up. Idempotent: if a profile already exists the type is left unchanged
 * (account type is fixed once set).
 */
export const setType = mutation({
  args: {
    type: accountTypeValidator,
    calorieGoal: v.optional(v.number()),
  },
  handler: async (ctx, { type, calorieGoal }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("accounts", {
      userId,
      accountType: type,
      calorieGoal:
        type === "weightLoss"
          ? Math.max(0, Math.round(calorieGoal ?? 0))
          : undefined,
    });
  },
});
