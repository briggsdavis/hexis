"use client";

import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { MultiRing } from "./MultiRing";
import { ProgressRing } from "./ProgressRing";
import { HoverText } from "@/components/ui/HoverText";
import { RiseGroup, RiseItem } from "@/components/ui/Rise";
import { completionColor, formatPercent } from "@/lib/colors";
import { periodRange, todayKey } from "@/lib/dates";

type Period = "daily" | "weekly" | "monthly" | "yearly";
const PERIODS: Period[] = ["daily", "weekly", "monthly", "yearly"];

export function ProgressPanel() {
  const today = todayKey();
  const [period, setPeriod] = useState<Period>("daily");
  const range = periodRange(period, today);

  const day = useQuery(api.analytics.dayProgress, { date: today });
  const periodData = useQuery(api.analytics.periodProgress, range);
  const overview = useQuery(api.analytics.overview, { today });

  const overall =
    period === "daily" ? (day?.overall ?? 0) : (periodData?.overall ?? 0);

  const rings = [
    { color: completionColor(overall), ratio: overall },
    ...(day?.categoryRings ?? []).map((c) => ({
      color: c.color,
      ratio: c.completion,
    })),
  ];

  return (
    <aside className="clean-scroll h-screen w-[320px] shrink-0 overflow-y-auto border-l border-border bg-surface-muted p-6">
      <RiseGroup className="flex flex-col gap-6">
      <RiseItem className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
        {PERIODS.map((p) => (
          <motion.button
            key={p}
            onClick={() => setPeriod(p)}
            whileTap={{ scale: 0.94 }}
            className={`group/btn flex flex-1 items-center justify-center rounded-md py-1.5 capitalize transition-120 ${
              period === p
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <HoverText>{p}</HoverText>
          </motion.button>
        ))}
      </RiseItem>

      <RiseItem className="flex flex-col items-center">
        <MultiRing
          rings={rings.slice(0, 5)}
          size={200}
          stroke={11}
          gap={5}
          center={
            <>
              <span className="text-xl font-semibold leading-none tabular-nums">
                {formatPercent(overall)}
              </span>
              <span className="mt-0.5 text-[9px] uppercase tracking-wide text-gray-400">
                {period}
              </span>
            </>
          }
        />
      </RiseItem>

      <RiseItem className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 text-sm">
          <Flame size={16} className="text-orange-500" />
          <span className="font-medium text-gray-800">Current streak</span>
          <span className="ml-auto text-lg font-semibold tabular-nums">
            {overview?.currentStreak ?? 0}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Longest: {overview?.longestStreak ?? 0} days
        </p>
      </RiseItem>

      {(day?.categoryRings.length ?? 0) > 0 && (
        <RiseItem>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            By category
          </h3>
          <div className="flex flex-col gap-3">
            {day!.categoryRings.map((c) => (
              <div key={c.categoryId} className="flex items-center gap-3">
                <ProgressRing
                  ratio={c.completion}
                  color={c.color}
                  size={36}
                  stroke={4}
                />
                <span className="flex-1 truncate text-sm text-gray-700">
                  {c.name}
                </span>
                <span className="text-sm tabular-nums text-gray-500">
                  {formatPercent(c.completion)}
                </span>
              </div>
            ))}
          </div>
        </RiseItem>
      )}
      </RiseGroup>
    </aside>
  );
}
