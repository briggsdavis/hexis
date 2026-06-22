"use client";

import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { HoverText } from "@/components/ui/HoverText";
import { RiseGroup, RiseItem } from "@/components/ui/Rise";
import { formatPercent } from "@/lib/colors";
import { periodRange, todayKey } from "@/lib/dates";

// Lazy-load the (heavy) recharts trend chart so it doesn't bloat the route's
// initial JS — the page renders immediately and the chart fills in after.
const TrendChart = dynamic(() => import("./TrendChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-300">
      Loading chart…
    </div>
  ),
});

type Range = "weekly" | "monthly" | "yearly";
const RANGES: { key: Range; label: string; days: number }[] = [
  { key: "weekly", label: "7 days", days: 7 },
  { key: "monthly", label: "30 days", days: 30 },
  { key: "yearly", label: "1 year", days: 365 },
];

export function AnalyticsView() {
  const today = todayKey();
  const [range, setRange] = useState<Range>("monthly");
  const windowDays = RANGES.find((r) => r.key === range)!.days;

  const overview = useQuery(api.analytics.overview, { today });
  const trend = useQuery(api.analytics.trend, periodRange(range, today));
  const habitStats = useQuery(api.analytics.habitStats, {
    today,
    windowDays,
  });
  const categories = useQuery(api.categories.list);

  const categoryRows = useMemo(() => {
    if (!habitStats || !categories) return [];
    return categories
      .filter((c) => !c.archived)
      .map((cat) => {
        const rows = habitStats.filter((h) => h.categoryId === cat._id);
        if (rows.length === 0) return null;
        const avg =
          rows.reduce((s, r) => s + r.completionRate, 0) / rows.length;
        const sorted = [...rows].sort(
          (a, b) => b.completionRate - a.completionRate,
        );
        return {
          id: cat._id,
          name: cat.name,
          color: cat.color,
          avg,
          best: sorted[0],
          worst: sorted[sorted.length - 1],
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      color: string;
      avg: number;
      best: { name: string; completionRate: number };
      worst: { name: string; completionRate: number };
    }>;
  }, [habitStats, categories]);

  return (
    <main className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8">
      <RiseGroup>
      <RiseItem>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Analytics</h1>
      </RiseItem>

      {/* Overview cards (PRD §15) */}
      <RiseItem className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card label="Current" value={formatPercent(overview?.current ?? 0)} />
        <Card label="7-day avg" value={formatPercent(overview?.sevenDayAvg ?? 0)} />
        <Card
          label="30-day avg"
          value={formatPercent(overview?.thirtyDayAvg ?? 0)}
        />
        <Card label="Current streak" value={`${overview?.currentStreak ?? 0}`} />
        <Card label="Longest streak" value={`${overview?.longestStreak ?? 0}`} />
      </RiseItem>

      {/* Trend graph (PRD §18.6) */}
      <RiseItem className="mt-8 block rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Completion trend
          </h2>
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {RANGES.map((r) => (
              <motion.button
                key={r.key}
                onClick={() => setRange(r.key)}
                whileTap={{ scale: 0.94 }}
                className={`group/btn rounded-md px-2.5 py-1 transition-120 ${
                  range === r.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <HoverText>{r.label}</HoverText>
              </motion.button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <TrendChart data={trend ?? []} />
        </div>
      </RiseItem>

      {/* Category analytics (PRD §15) */}
      <RiseItem>
      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-800">
        By category
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {categoryRows.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-card"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="font-medium text-gray-800">{c.name}</span>
              <span className="ml-auto text-sm tabular-nums text-gray-500">
                {formatPercent(c.avg)} avg
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Mini
                label="Best"
                name={c.best.name}
                value={formatPercent(c.best.completionRate)}
              />
              <Mini
                label="Worst"
                name={c.worst.name}
                value={formatPercent(c.worst.completionRate)}
              />
            </div>
          </div>
        ))}
      </div>
      </RiseItem>

      {/* Habit analytics (PRD §15) */}
      <RiseItem>
      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-800">
        By habit
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Habit</th>
              <th className="px-4 py-2 text-right font-medium">Rate</th>
              <th className="px-4 py-2 text-right font-medium">Streak</th>
              <th className="px-4 py-2 text-right font-medium">Longest</th>
              <th className="px-4 py-2 text-right font-medium">Avg value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(habitStats ?? []).map((h) => (
              <tr key={h.habitId}>
                <td className="px-4 py-2.5 text-gray-800">{h.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                  {formatPercent(h.completionRate)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                  {h.currentStreak}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                  {h.longestStreak}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">
                  {h.type === "quantitative"
                    ? h.averageValue.toFixed(1)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </RiseItem>
      </RiseGroup>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Mini({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-surface-muted px-2.5 py-2">
      <p className="text-gray-400">{label}</p>
      <p className="truncate font-medium text-gray-700">{name}</p>
      <p className="tabular-nums text-gray-500">{value}</p>
    </div>
  );
}
