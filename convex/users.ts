import { query } from "./_generated/server";
import { getUser } from "./lib/auth";

/** The currently signed-in user, or null. */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUser(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});
