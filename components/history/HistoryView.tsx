"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { HoverText } from "@/components/ui/HoverText";
import { DayDrawer } from "./DayDrawer";
import { completionColor } from "@/lib/colors";
import {
  addDays,
  formatMonthYear,
  formatWeekRange,
  formatYear,
  monthBounds,
  parseKey,
  todayKey,
  weekBounds,
  yearBounds,
} from "@/lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type View = "weekly" | "monthly" | "yearly";
const VIEWS: View[] = ["weekly", "monthly", "yearly"];

type DayData = {
  completion: number;
  completedCount: number;
  missedCount: number;
  scheduledCount: number;
};

export function HistoryView() {
  const [view, setView] = useState<View>("monthly");
  const [anchor, setAnchor] = useState(() => todayKey());
  const [selected, setSelected] = useState<string | null>(null);

  const bounds =
    view === "weekly"
      ? weekBounds(anchor)
      : view === "monthly"
        ? monthBounds(anchor)
        : yearBounds(anchor);

  const days = useQuery(api.analytics.calendar, {
    start: bounds.start,
    end: bounds.end,
  });

  const dataByDate = useMemo(() => {
    const m = new Map<string, DayData>();
    for (const d of days ?? []) m.set(d.date, d);
    return m;
  }, [days]);

  const step = (dir: 1 | -1) => {
    if (view === "weekly") setAnchor(addDays(anchor, dir * 7));
    else if (view === "monthly")
      setAnchor(monthBounds(addDays(monthBounds(anchor).start, dir * 15)).start);
    else
      setAnchor(`${parseKey(anchor).getFullYear() + dir}-06-15`);
  };

  const label =
    view === "weekly"
      ? formatWeekRange(bounds.start, bounds.end)
      : view === "monthly"
        ? formatMonthYear(anchor)
        : formatYear(anchor);

  return (
    <main className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>

        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="relative flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  setAnchor(todayKey());
                }}
                className={`relative z-10 rounded-md px-3 py-1.5 capitalize transition-120 ${
                  view === v ? "text-white" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {view === v && (
                  <motion.span
                    layoutId="history-view-pill"
                    className="absolute inset-0 -z-10 rounded-md bg-gray-900"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <HoverText>{v}</HoverText>
              </button>
            ))}
          </div>

          {/* Range nav */}
          <div className="flex items-center gap-3">
            <NavBtn onClick={() => step(-1)} label="Previous">
              <ChevronLeft size={18} />
            </NavBtn>
            <span className="w-40 text-center text-sm font-medium">{label}</span>
            <NavBtn onClick={() => step(1)} label="Next">
              <ChevronRight size={18} />
            </NavBtn>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${bounds.start}`}
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === "weekly" && (
            <WeekGrid bounds={bounds} dataByDate={dataByDate} onSelect={setSelected} />
          )}
          {view === "monthly" && (
            <MonthGrid bounds={bounds} dataByDate={dataByDate} onSelect={setSelected} />
          )}
          {view === "yearly" && (
            <YearGrid year={parseKey(anchor).getFullYear()} dataByDate={dataByDate} onSelect={setSelected} />
          )}
        </motion.div>
      </AnimatePresence>

      <DayDrawer date={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function WeekGrid({
  bounds,
  dataByDate,
  onSelect,
}: {
  bounds: { start: string; end: string };
  dataByDate: Map<string, DayData>;
  onSelect: (d: string) => void;
}) {
  const today = todayKey();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(bounds.start, i));
  return (
    <div className="grid grid-cols-7 gap-3">
      {dates.map((date) => (
        <div key={date}>
          <div className="mb-1 px-1 text-xs font-medium text-gray-400">
            {WEEKDAYS[(parseKey(date).getDay() + 6) % 7]}
          </div>
          <DayCell
            date={date}
            big
            isToday={date === today}
            isFuture={date > today}
            data={dataByDate.get(date)}
            onClick={() => onSelect(date)}
          />
        </div>
      ))}
    </div>
  );
}

function MonthGrid({
  bounds,
  dataByDate,
  onSelect,
}: {
  bounds: { start: string; end: string };
  dataByDate: Map<string, DayData>;
  onSelect: (d: string) => void;
}) {
  const today = todayKey();
  const firstDow = parseKey(bounds.start).getDay();
  const leading = (firstDow + 6) % 7;
  const daysInMonth = parseKey(bounds.end).getDate();
  const cells: (string | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(bounds.start, i)),
  ];

  return (
    <>
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
              onClick={() => onSelect(date)}
            />
          ),
        )}
      </div>
    </>
  );
}

function YearGrid({
  year,
  dataByDate,
  onSelect,
}: {
  year: number;
  dataByDate: Map<string, DayData>;
  onSelect: (d: string) => void;
}) {
  const today = todayKey();
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
      {MONTHS.map((m, mi) => {
        const monthStart = `${year}-${String(mi + 1).padStart(2, "0")}-01`;
        const { start, end } = monthBounds(monthStart);
        const firstDow = parseKey(start).getDay();
        const leading = (firstDow + 6) % 7;
        const daysInMonth = parseKey(end).getDate();
        const cells: (string | null)[] = [
          ...Array(leading).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => addDays(start, i)),
        ];
        return (
          <div key={m}>
            <div className="mb-1.5 text-xs font-semibold text-gray-600">{m}</div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (date === null) return <div key={`b-${i}`} className="h-4 w-4" />;
                const data = dataByDate.get(date);
                const has = (data?.scheduledCount ?? 0) > 0;
                const future = date > today;
                return (
                  <button
                    key={date}
                    disabled={future}
                    onClick={() => onSelect(date)}
                    title={
                      has
                        ? `${parseKey(date).toLocaleDateString()} · ${Math.round((data?.completion ?? 0) * 100)}%`
                        : parseKey(date).toLocaleDateString()
                    }
                    className={`h-4 w-4 rounded-[3px] transition-transform hover:scale-125 ${
                      date === today ? "ring-1 ring-gray-900 ring-offset-1" : ""
                    }`}
                    style={{
                      backgroundColor: future
                        ? "transparent"
                        : has
                          ? completionColor(data!.completion)
                          : "#EDEDED",
                      opacity: has ? 0.35 + 0.65 * (data?.completion ?? 0) : 1,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayCell({
  date,
  data,
  isToday,
  isFuture,
  big,
  onClick,
}: {
  date: string;
  data?: DayData;
  isToday: boolean;
  isFuture: boolean;
  big?: boolean;
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
          : "border-border hover:scale-[1.02] hover:shadow-card"
      } ${isToday ? "ring-2 ring-gray-900 ring-offset-1" : ""}`}
    >
      <span className="absolute left-2 top-1.5 text-xs text-gray-400">
        {dayNum}
      </span>
      {!isFuture && hasData && (
        <ProgressRing
          ratio={completion}
          color={completionColor(completion)}
          size={big ? 64 : 48}
          stroke={big ? 6 : 5}
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

function NavBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-surface-muted"
    >
      {children}
    </motion.button>
  );
}
