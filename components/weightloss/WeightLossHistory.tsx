"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { parseKey, todayKey } from "@/lib/dates";
import { HoverText } from "@/components/ui/HoverText";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CalorieStepper } from "./CalorieStepper";
import { Toast, ToastTone } from "./Toast";
import { pickMessage } from "./messages";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

type Day = { date: string; net: number; hasEntry: boolean };

export function WeightLossHistory() {
  const today = todayKey();
  const [range, setRange] = useState<Range>(7);
  const days = useQuery(api.weightLoss.history, { end: today, days: range });

  const [editing, setEditing] = useState<Day | null>(null);
  // Toast lives here (not in the modal) so it survives the modal closing.
  const [toast, setToast] = useState<{
    id: number;
    text: string;
    tone: ToastTone;
  } | null>(null);

  const deficitDays = (days ?? []).filter(
    (d) => d.hasEntry && d.net > 0,
  ).length;
  const surplusDays = (days ?? []).filter(
    (d) => d.hasEntry && d.net < 0,
  ).length;

  return (
    <main className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-gray-400">
            <span className="text-green-600">{deficitDays} deficit</span> ·{" "}
            <span className="text-red-500">{surplusDays} surplus</span> in the
            last {range} days
          </p>
        </div>

        {/* Range toggle */}
        <div className="relative flex rounded-lg border border-border bg-surface p-0.5 text-xs">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`relative z-10 rounded-md px-3 py-1.5 transition-120 ${
                range === r ? "text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {range === r && (
                <motion.span
                  layoutId="wl-history-pill"
                  className="absolute inset-0 -z-10 rounded-md bg-gray-900"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <HoverText>{r} days</HoverText>
            </button>
          ))}
        </div>
      </motion.div>

      {days === undefined ? (
        <p className="py-12 text-center text-gray-400">Loading…</p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.ul
            key={range}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex max-w-2xl flex-col gap-1.5"
          >
            {days.map((d) => (
              <DayRow
                key={d.date}
                day={d}
                isToday={d.date === today}
                onClick={() => setEditing(d)}
              />
            ))}
          </motion.ul>
        </AnimatePresence>
      )}

      {editing && (
        <DayEditModal
          day={editing}
          onClose={() => setEditing(null)}
          onSaved={(net) =>
            setToast({
              id: Date.now(),
              text: pickMessage(net),
              tone: net > 0 ? "deficit" : net < 0 ? "surplus" : "neutral",
            })
          }
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </main>
  );
}

function dayTone(d: Day): { bar: string; text: string; value: string } {
  if (d.hasEntry && d.net > 0)
    return {
      bar: "#22C55E",
      text: "text-green-600",
      value: `+${d.net.toLocaleString()}`,
    };
  if (d.hasEntry && d.net < 0)
    return {
      bar: "#EF4444",
      text: "text-red-500",
      value: `−${Math.abs(d.net).toLocaleString()}`,
    };
  // No entry, or an exact-zero day: light green / neutral.
  return {
    bar: "#BBF7D0",
    text: "text-gray-400",
    value: d.hasEntry ? "0" : "—",
  };
}

function DayRow({
  day,
  isToday,
  onClick,
}: {
  day: Day;
  isToday: boolean;
  onClick: () => void;
}) {
  const tone = dayTone(day);
  const date = parseKey(day.date);
  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.li whileHover={{ x: 2 }}>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-120 hover:shadow-card ${
          isToday ? "border-gray-900" : "border-border"
        }`}
      >
        <span
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: tone.bar }}
        />
        <span className="flex-1 text-sm font-medium text-gray-800">
          {label}
          {isToday && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              Today
            </span>
          )}
        </span>
        <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
          {tone.value}
        </span>
        <span className="text-xs text-gray-300">cal</span>
      </button>
    </motion.li>
  );
}

function DayEditModal({
  day,
  onClose,
  onSaved,
}: {
  day: Day;
  onClose: () => void;
  onSaved: (net: number) => void;
}) {
  const setEntry = useMutation(api.weightLoss.setEntry);
  const [value, setValue] = useState(day.net);
  const [saving, setSaving] = useState(false);

  // Keep the stepper in sync if a different day is opened.
  useEffect(() => setValue(day.net), [day.date, day.net]);

  const label = parseKey(day.date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const save = async () => {
    setSaving(true);
    try {
      await setEntry({ date: day.date, net: value });
      onSaved(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={label}>
      <p className="text-sm text-gray-500">
        Adjust this day&apos;s net. A deficit adds to your goal; a surplus eases
        it back.
      </p>
      <div className="my-6">
        <CalorieStepper value={value} onChange={setValue} step={50} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  );
}
