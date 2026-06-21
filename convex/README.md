# Convex backend

This directory is the HabitFlow backend — schema, auth, and all queries/mutations.

## Files

- `schema.ts` — tables + indexes (categories, habits, completions, tasks, auth).
- `auth.ts` / `auth.config.ts` / `http.ts` — Convex Auth (email + password).
- `categories.ts` — categories & subcategories (create, reorder, archive, restore).
- `habits.ts` — habits (create, update, pause/resume, soft delete, reorder).
- `completions.ts` — daily completion values + checkbox toggle.
- `tasks.ts` — one-time tasks with carry-forward.
- `analytics.ts` — completion math, calendar data, streaks, trends, overview.
- `lib/` — shared helpers (auth guard, dates, scheduling, streak engine).
- `_generated/` — **auto-generated** by the Convex CLI. Created on first
  `npx convex dev`; until then imports from `./_generated/...` won't resolve.

## Setup

```bash
npm install
npx convex dev   # creates the deployment, runs auth setup, writes .env.local
```
