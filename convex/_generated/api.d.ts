/* eslint-disable */
/**
 * Generated `api` utility. THIS CODE IS AUTOMATICALLY GENERATED.
 */
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts from "../accounts.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as completions from "../completions.js";
import type * as goals from "../goals.js";
import type * as habits from "../habits.js";
import type * as http from "../http.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as weightLoss from "../weightLoss.js";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  analytics: typeof analytics;
  auth: typeof auth;
  categories: typeof categories;
  completions: typeof completions;
  goals: typeof goals;
  habits: typeof habits;
  http: typeof http;
  tasks: typeof tasks;
  users: typeof users;
  weightLoss: typeof weightLoss;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
