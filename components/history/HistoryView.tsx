"use client";

import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { DayDrawer } from "./DayDrawer";
import { completionColor } from "@/lib/colors";
import {
  addDays,
  formatMonthYear,
  monthBounds,
  parseKey,
  todayKey,
} from "@/lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HistoryView() {
  // Anchor on the first of the current month.
  const [anchor, setAnchor] = useState(() => monthBounds(todayKey()).start);
  const [selected, setSelected] = useState<string | null>(null);

  const { start, end } = monthBounds(anchor);
  const days = useQuery(api.analytics.calendar, { start, end });

  const dataByDate = useMemo(() => {
    const m = new Map<string, NonNullable<typeof days>[number]>();
    for (const d of days ?? []) m.set(d.date, d);
    return m;
  }, [days]);

  // Monday-first leading blanks.
  const firstDow = parseKey(start).getDay(); // 0=Sun
  const leading = (firstDow + 6) % 7;
  const daysInMonth = parseKey(end).getDate();
  const cells: (string | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(start, i)),
  ];
  const today = todayKey();

  return (
    <main className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnchor(monthBounds(addDays(start, -1)).start)}
            className="rounded-md p-1.5 text-gray-500 transition-120 hover:bg-surface-muted"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-40 text-center text-sm font-medium">
            {formatMonthYear(anchor)}
          </span>
          <button
            onClick={() => setAnchor(monthBounds(addDays(end, 1)).start)}
            className="rounded-md p-1.5 text-gray-500 transition-120 hover:bg-surface-muted"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px text-xs font-medium text-gray-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-2">
        {cells.map((date, i) =>
          date === null ? (
            <div key={`blank-${i}`} />
          ) : (
            <DayCell
              key={date}
              date={date}
              isToday={date === today}
              isFuture={date > today}
              data={dataByDate.get(date)}
              onClick={() => setSelected(date)}
            />
          ),
        )}
      </div>

      <DayDrawer date={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function DayCell({
  date,
  data,
  isToday,
  isFuture,
  onClick,
}: {
  date: string;
  data?: {
    completion: number;
    completedCount: number;
    missedCount: number;
    scheduledCount: number;
  };
  isToday: boolean;
  isFuture: boolean;
  onClick: () => void;
}) {
  const dayNum = parseKey(date).getDate();
  const completion = data?.completion ?? 0;
  const hasData = (data?.scheduledCount ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      title={
        hasData
          ? `${Math.round(completion * 100)}% · ${data!.completedCount} done · ${data!.missedCount} missed`
          : "No habits scheduled"
      }
      className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border transition-120 ${
        isFuture
          ? "border-transparent text-gray-300"
          : "border-border hover:scale-[1.01] hover:shadow-card"
      } ${isToday ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
    >
      <span className="absolute left-2 top-1.5 text-xs text-gray-400">
        {dayNum}
      </span>
      {!isFuture && hasData && (
        <ProgressRing
          ratio={completion}
          color={completionColor(completion)}
          size={48}
          stroke={5}
          duration={0.4}
        >
          <span className="text-[11px] font-medium tabular-nums">
            {Math.round(completion * 100)}
          </span>
        </ProgressRing>
      )}
    </button>
  );
}
