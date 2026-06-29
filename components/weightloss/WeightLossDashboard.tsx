"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Pencil, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { formatLong, todayKey } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { RiseGroup, RiseItem } from "@/components/ui/Rise";
import { TopoLines } from "@/components/ui/TopoLines";
import { CalorieStepper } from "./CalorieStepper";
import { GoalModal } from "./GoalModal";
import { Toast, ToastTone } from "./Toast";
import { Vial } from "./Vial";
import { pickMessage } from "./messages";

export function WeightLossDashboard() {
  const today = todayKey();
  const summary = useQuery(api.weightLoss.summary, { date: today });
  const setEntry = useMutation(api.weightLoss.setEntry);

  const [pending, setPending] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [toast, setToast] = useState<{
    id: number;
    text: string;
    tone: ToastTone;
  } | null>(null);

  // Seed the stepper from the saved value once the summary first loads.
  useEffect(() => {
    if (summary && pending === null) setPending(summary.todayNet ?? 0);
  }, [summary, pending]);

  const loading = summary === undefined || pending === null;
  const net = pending ?? 0;
  const alreadyLogged = (summary?.todayNet ?? null) !== null;

  const save = async () => {
    if (pending === null) return;
    setSaving(true);
    try {
      await setEntry({ date: today, net: pending });
      const tone: ToastTone =
        pending > 0 ? "deficit" : pending < 0 ? "surplus" : "neutral";
      setToast({ id: Date.now(), text: pickMessage(pending), tone });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8"
      >
        <RiseGroup>
          <RiseItem>
            <header className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Today
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {formatLong(today)}
                </h1>
              </div>
            </header>
          </RiseItem>

          <RiseItem>
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-8 shadow-card">
              <h2 className="text-center text-sm font-semibold text-gray-800">
                Log today&apos;s balance
              </h2>
              <p className="mx-auto mt-1 max-w-xs text-center text-xs text-gray-400">
                Tap toward your net for the day. A deficit fills the vial; a
                surplus eases it back.
              </p>

              <div className="my-7">
                {loading ? (
                  <p className="py-8 text-center text-gray-400">Loading…</p>
                ) : (
                  <CalorieStepper value={net} onChange={setPending} step={50} />
                )}
              </div>

              <Button
                onClick={save}
                disabled={saving || loading}
                className="w-full justify-center"
              >
                {saving
                  ? "Saving…"
                  : alreadyLogged
                    ? "Update today"
                    : "Log today"}
              </Button>
            </div>
          </RiseItem>
        </RiseGroup>
      </motion.main>

      <VialPanel
        loading={summary === undefined}
        percent={summary?.percent ?? 0}
        total={summary?.total ?? 0}
        goal={summary?.goal ?? 0}
        reached={summary?.reached ?? false}
        onEditGoal={() => setGoalOpen(true)}
      />

      {goalOpen && (
        <GoalModal
          open
          current={summary?.goal ?? 0}
          onClose={() => setGoalOpen(false)}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function VialPanel({
  loading,
  percent,
  total,
  goal,
  reached,
  onEditGoal,
}: {
  loading: boolean;
  percent: number;
  total: number;
  goal: number;
  reached: boolean;
  onEditGoal: () => void;
}) {
  return (
    <aside className="relative isolate h-screen w-[320px] shrink-0 overflow-hidden border-l border-border bg-surface-muted">
      <TopoLines />
      <div className="clean-scroll flex h-full flex-col items-center overflow-y-auto p-6">
        <RiseGroup className="flex w-full flex-col items-center gap-5">
          <RiseItem className="w-full text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Goal progress
            </h2>
          </RiseItem>

          <RiseItem className="h-[300px] w-[160px]">
            <Vial
              percent={percent}
              reached={reached}
              className="h-full w-full"
            />
          </RiseItem>

          <RiseItem className="flex flex-col items-center">
            {loading ? (
              <span className="text-gray-400">…</span>
            ) : goal <= 0 ? (
              <p className="text-center text-sm text-gray-500">
                No goal set yet.
              </p>
            ) : (
              <>
                <span className="text-4xl font-semibold tabular-nums text-gray-900">
                  {Math.round(percent * 100)}%
                </span>
                <span className="mt-1 text-sm tabular-nums text-gray-500">
                  {total.toLocaleString()} / {goal.toLocaleString()} cal
                </span>
                {reached && (
                  <span className="mt-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Goal reached 🎉
                  </span>
                )}
              </>
            )}
          </RiseItem>

          <RiseItem className="w-full">
            <button
              onClick={onEditGoal}
              className="group/btn flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-gray-600 transition-120 hover:text-gray-900"
            >
              {goal <= 0 ? <Target size={14} /> : <Pencil size={14} />}
              {goal <= 0 ? "Set your goal" : "Edit goal"}
            </button>
          </RiseItem>
        </RiseGroup>
      </div>
    </aside>
  );
}
