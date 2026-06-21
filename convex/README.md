# Convex backend

This directory holds the Hexis backend — the database schema and the
queries/mutations the frontend calls.

## Files

- `schema.ts` — table definitions and indexes.
- `habits.ts` — create / list / update / archive / delete habits.
- `completions.ts` — toggle daily completions and compute streaks.
- `_generated/` — **auto-generated** by the Convex CLI. Do not edit by hand.
  This folder appears the first time you run `npx convex dev`. Until then,
  imports from `./_generated/...` will not resolve.

## Getting started

```bash
npm install
npx convex dev      # creates your deployment + the _generated folder
```

`npx convex dev` will prompt you to log in / create a project and will write
`VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` into `.env.local`.

## Adding auth

The scaffold is single-user. To make it multi-user, configure a Convex auth
provider, add a `userId` field to the `habits` table in `schema.ts`, set it on
insert from `ctx.auth`, and scope every query by the authenticated user.
