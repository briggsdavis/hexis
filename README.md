# HabitFlow

A desktop-first habit tracker — recurring habits, one-time tasks, streaks,
history, and analytics. Built with **Next.js (App Router) + TypeScript**,
**Convex** (database, functions, and auth), **Tailwind CSS**, **Framer Motion**,
and **Recharts**.

## Features

- Email/password accounts (Convex Auth) — all data is private to each user
- Three-column dashboard: categories · today's habits & tasks · progress rings
- Categories & subcategories with color, icon, drag-and-drop ordering, archive
- Checkbox and quantitative habits (numeric or increment input)
- Scheduling: daily, weekdays, weekends, or custom days; pause/resume
- Current & longest streaks based on scheduled occurrences
- One-time tasks via double-click; incomplete tasks carry forward
- Apple-Fitness-style multi-ring progress with daily/weekly/monthly/yearly toggle
- History calendar with editable day detail drawer (recalculates live)
- Analytics page: overview cards, trend chart, category & habit breakdowns

## Project structure

```
app/                 # Next.js routes
  page.tsx           #   dashboard (today)
  history/           #   calendar + day drawer
  analytics/         #   charts & breakdowns
  signin/            #   auth
components/          # UI by feature (layout, categories, habits, tasks, …)
convex/             # backend: schema, auth, functions, analytics (see its README)
lib/                # client helpers (dates, colors, icons, scheduling)
middleware.ts       # Convex Auth route protection
```

## Getting started (local)

```bash
npm install
npx convex dev      # one-time: creates your Convex project + .env.local
npm run dev         # runs Next.js + convex dev together
```

Open http://localhost:3000.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this there).
2. In Convex, create a **production** deployment: `npx convex deploy`.
   This prints a production URL and sets a deploy key.
3. Import the repo on **vercel.com → New Project**.
4. Add these **Environment Variables** in Vercel:
   - `NEXT_PUBLIC_CONVEX_URL` → your Convex **production** URL
   - `CONVEX_DEPLOY_KEY` → the production deploy key from Convex
5. Set the Vercel **Build Command** to `npx convex deploy --cmd 'npm run build'`
   so Convex functions deploy alongside the frontend.
6. Deploy. Vercel gives you a live URL.

See `convex/README.md` for backend details.
