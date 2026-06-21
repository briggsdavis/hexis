"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { completionColor, formatPercent } from "@/lib/colors";
import { formatLong } from "@/lib/dates";

/** Day detail drawer with inline history editing (PRD §14.2). */
export function DayDrawer({
  date,
  onClose,
}: {
  date: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {date && <DrawerInner key={date} date={date} onClose={onClose} />}
    </AnimatePresence>
  );
}

function DrawerInner({ date, onClose }: { date: string; onClose: () => void }) {
  const detail = useQuery(api.analytics.dayDetail, { date });
  const toggle = useMutation(api.completions.toggle);
  const setValue = useMutation(api.completions.setValue);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-gray-900/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="clean-scroll fixed right-0 top-0 z-50 h-screen w-[420px] overflow-y-auto border-l border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {formatLong(date)}
            </h2>
            <p className="text-sm text-gray-400">Click an item to edit history</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-surface-muted"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {!detail ? (
          <p className="mt-8 text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <ProgressRing
                ratio={detail.overall}
                color={completionColor(detail.overall)}
                size={72}
                stroke={7}
              >
                <span className="text-sm font-semibold tabular-nums">
                  {formatPercent(detail.overall)}
                </span>
              </ProgressRing>
              <div className="text-sm text-gray-500">
                <p>{detail.completed.length} completed</p>
                <p>{detail.missed.length} missed</p>
              </div>
            </div>

            {detail.categoryBreakdown.length > 0 && (
              <Section title="Category breakdown">
                {detail.categoryBreakdown.map((c) => (
                  <div key={c.categoryId} className="flex items-center gap-2 py-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                    <span className="text-sm tabular-nums text-gray-500">
                      {formatPercent(c.completion)}
                    </span>
                  </div>
                ))}
              </Section>
            )}

            <Section title="Completed">
              {detail.completed.length === 0 ? (
                <Empty />
              ) : (
                detail.completed.map((h) => (
                  <EditRow
                    key={h.habitId}
                    name={h.name}
                    done
                    detail={
                      h.goalValue
                        ? `${h.value} / ${h.goalValue}`
                        : undefined
                    }
                    onClick={() =>
                      h.goalValue
                        ? setValue({
                            habitId: h.habitId as Id<"habits">,
                            date,
                            value: 0,
                          })
                        : toggle({
                            habitId: h.habitId as Id<"habits">,
                            date,
                          })
                    }
                  />
                ))
              )}
            </Section>

            <Section title="Missed">
              {detail.missed.length === 0 ? (
                <Empty />
              ) : (
                detail.missed.map((h) => (
                  <EditRow
                    key={h.habitId}
                    name={h.name}
                    detail={
                      h.goalValue
                        ? `${h.value} / ${h.goalValue}`
                        : undefined
                    }
                    onClick={() =>
                      h.goalValue
                        ? setValue({
                            habitId: h.habitId as Id<"habits">,
                            date,
                            value: h.goalValue,
                          })
                        : toggle({
                            habitId: h.habitId as Id<"habits">,
                            date,
                          })
                    }
                  />
                ))
              )}
            </Section>
          </div>
        )}
      </motion.div>
    </>
  );
}

function EditRow({
  name,
  detail,
  done,
  onClick,
}: {
  name: string;
  detail?: string;
  done?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-120 hover:bg-surface-muted"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          done
            ? "border-completion-full bg-completion-full text-white"
            : "border-gray-300 text-transparent"
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="flex-1 truncate text-sm text-gray-700">{name}</span>
      {detail && (
        <span className="text-xs tabular-nums text-gray-400">{detail}</span>
      )}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="px-2 py-1 text-sm text-gray-300">None</p>;
}
