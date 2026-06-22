"use client";

import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Flag,
  Minus,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { IconButton } from "@/components/ui/Button";

type GoalProgress = {
  mode: "streak" | "progressive";
  unit?: string;
  inputMode?: "numeric" | "increment";
  incrementStep?: number;
  deadline?: string;
  streak?: {
    current: number;
    best: number;
    target: number;
    skipsLeft: number;
    allowedSkips: number;
    ratio: number;
    completed: boolean;
    doneToday: boolean;
  };
  progressive?: {
    sum: number;
    target: number;
    ratio: number;
    completed: boolean;
    todayValue: number;
    projection?: {
      onTrack: boolean;
      expected: number;
      perDayNeeded: number;
      daysLeft: number;
    };
  };
};

export function GoalRow({
  goal,
  progress,
  value,
  date,
  onEdit,
}: {
  goal: Doc<"habits">;
  progress?: GoalProgress;
  value: number | undefined;
  date: string;
  onEdit: () => void;
}) {
  const toggle = useMutation(api.completions.toggle);
  const setValue = useMutation(api.completions.setValue);
  const setPaused = useMutation(api.habits.setPaused);
  const remove = useMutation(api.habits.remove);

  const [local, setLocal] = useState<number>(value ?? 0);
  useEffect(() => setLocal(value ?? 0), [value]);

  const mode = progress?.mode ?? goal.goalMode ?? "streak";
  const completed =
    mode === "streak"
      ? (progress?.streak?.completed ?? false)
      : (progress?.progressive?.completed ?? false);
  const ratio =
    mode === "streak"
      ? (progress?.streak?.ratio ?? 0)
      : (progress?.progressive?.ratio ?? 0);

  function commit(next: number) {
    setLocal(next);
    setValue({ habitId: goal._id, date, value: next });
  }

  const color = completed ? "#22C55E" : "#6366F1";
  const step = goal.incrementStep ?? progress?.incrementStep ?? 1;
  const doneToday = local >= 1;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
    >
      {/* Left control */}
      {mode === "streak" ? (
        <motion.button
          onClick={() => {
            setLocal(doneToday ? 0 : 1);
            toggle({ habitId: goal._id, date });
          }}
          aria-label={doneToday ? "Mark not done today" : "Mark done today"}
          whileTap={{ scale: 0.9 }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-120 ${
            doneToday
              ? "border-completion-full bg-completion-full text-white"
              : "border-gray-300 text-transparent hover:border-gray-400"
          }`}
        >
          <Check size={15} strokeWidth={3} />
        </motion.button>
      ) : (
        <ProgressRing ratio={ratio} color={color} size={34} stroke={4}>
          {completed ? (
            <Trophy size={13} className="text-completion-full" />
          ) : (
            <Flag size={12} className="text-gray-400" />
          )}
        </ProgressRing>
      )}

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={`truncate text-sm font-medium ${completed ? "text-gray-400" : "text-gray-800"}`}
          >
            {goal.name}
          </p>
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-500">
            {mode === "streak" ? "Streak" : "Goal"}
          </span>
          {completed && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-completion-full">
              <Trophy size={11} /> Done
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-400">{subtitle(progress, mode)}</p>
      </div>

      {/* Progressive logging controls */}
      {mode === "progressive" && (
        <div className="flex items-center gap-1.5">
          {goal.inputMode === "numeric" ? (
            <input
              type="number"
              value={local || ""}
              onChange={(e) => commit(Math.max(0, Number(e.target.value)))}
              className="w-16 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-gray-400"
              placeholder="0"
            />
          ) : (
            <>
              <IconButton
                onClick={() => commit(Math.max(0, local - step))}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-gray-500 hover:bg-surface-muted"
                label="Decrease today"
              >
                <Minus size={13} />
              </IconButton>
              <span className="w-8 text-center text-sm tabular-nums text-gray-600">
                {local}
              </span>
              <IconButton
                onClick={() => commit(local + step)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-gray-500 hover:bg-surface-muted"
                label="Add to today"
              >
                <Plus size={13} />
              </IconButton>
            </>
          )}
        </div>
      )}

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 transition-120 group-hover:opacity-100">
        <IconButton
          onClick={() => setPaused({ id: goal._id, paused: !goal.paused })}
          className="rounded-md p-1.5 text-gray-400 hover:bg-surface-muted hover:text-gray-900"
          label={goal.paused ? "Resume" : "Pause"}
        >
          {goal.paused ? <Play size={14} /> : <Pause size={14} />}
        </IconButton>
        <IconButton
          onClick={onEdit}
          className="rounded-md p-1.5 text-gray-400 hover:bg-surface-muted hover:text-gray-900"
          label="Edit"
        >
          <Pencil size={14} />
        </IconButton>
        <IconButton
          onClick={() => remove({ id: goal._id })}
          className="rounded-md p-1.5 text-gray-400 hover:bg-surface-muted hover:text-red-600"
          label="Delete"
        >
          <Trash2 size={14} />
        </IconButton>
      </div>
    </motion.div>
  );
}

function subtitle(progress: GoalProgress | undefined, mode: string): string {
  if (!progress) return "Goal";
  if (mode === "streak" && progress.streak) {
    const s = progress.streak;
    if (s.completed) return `Reached ${s.target} days 🎉`;
    const skips =
      s.allowedSkips > 0 ? ` · ${s.skipsLeft}/${s.allowedSkips} skips left` : "";
    return `Day ${s.current} of ${s.target}${skips}`;
  }
  if (mode === "progressive" && progress.progressive) {
    const p = progress.progressive;
    const unit = progress.unit ? ` ${progress.unit}` : "";
    const base = `${round(p.sum)} / ${round(p.target)}${unit}`;
    if (p.completed) return `${base} · complete 🎉`;
    if (p.projection) {
      const proj = p.projection;
      if (proj.daysLeft <= 0) return base;
      return `${base} · ~${round(proj.perDayNeeded)}${unit}/day for ${proj.daysLeft}d${proj.onTrack ? " · on track" : " · behind"}`;
    }
    return base;
  }
  return "Goal";
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
