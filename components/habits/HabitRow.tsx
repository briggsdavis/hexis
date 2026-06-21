"use client";

import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Check, Minus, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

export function HabitRow({
  habit,
  value,
  date,
  onEdit,
}: {
  habit: Doc<"habits">;
  value: number | undefined;
  date: string;
  onEdit: () => void;
}) {
  const toggle = useMutation(api.completions.toggle);
  const setValue = useMutation(api.completions.setValue);
  const setPaused = useMutation(api.habits.setPaused);
  const remove = useMutation(api.habits.remove);

  // Optimistic local value (PRD §18.3 item 7).
  const [local, setLocal] = useState<number>(value ?? 0);
  useEffect(() => setLocal(value ?? 0), [value]);

  const isQuant = habit.type === "quantitative";
  const goal = habit.goalValue ?? 1;
  const ratio = isQuant ? Math.min(local / goal, 1) : local >= 1 ? 1 : 0;
  const complete = ratio >= 1;

  function commit(next: number) {
    setLocal(next);
    setValue({ habitId: habit._id, date, value: next });
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
    >
      {isQuant ? (
        <QuantControl
          habit={habit}
          value={local}
          ratio={ratio}
          onChange={commit}
        />
      ) : (
        <Checkbox
          complete={complete}
          onToggle={() => {
            const next = complete ? 0 : 1;
            setLocal(next);
            toggle({ habitId: habit._id, date });
          }}
        />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium strike-anim ${
            complete ? "struck text-gray-400" : "text-gray-800"
          }`}
        >
          {habit.name}
        </p>
        {isQuant && (
          <p className="text-xs text-gray-400">
            {local}
            {local > goal ? ` (+${local - goal})` : ""} / {goal}
            {habit.unit ? ` ${habit.unit}` : ""}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 transition-120 group-hover:opacity-100">
        <IconBtn
          label={habit.paused ? "Resume" : "Pause"}
          onClick={() => setPaused({ id: habit._id, paused: !habit.paused })}
        >
          {habit.paused ? <Play size={14} /> : <Pause size={14} />}
        </IconBtn>
        <IconBtn label="Edit" onClick={onEdit}>
          <Pencil size={14} />
        </IconBtn>
        <IconBtn label="Delete" onClick={() => remove({ id: habit._id })}>
          <Trash2 size={14} />
        </IconBtn>
      </div>
    </motion.div>
  );
}

function Checkbox({
  complete,
  onToggle,
}: {
  complete: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      aria-pressed={complete}
      aria-label={complete ? "Mark incomplete" : "Mark complete"}
      animate={{ scale: complete ? 1.1 : 1 }}
      transition={{ duration: 0.08 }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-120 ${
        complete
          ? "border-completion-full bg-completion-full text-white"
          : "border-gray-300 text-transparent hover:border-gray-400"
      }`}
    >
      <motion.span
        initial={false}
        animate={{ opacity: complete ? 1 : 0 }}
        transition={{ duration: 0.12 }}
      >
        <Check size={14} strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
}

function QuantControl({
  habit,
  value,
  ratio,
  onChange,
}: {
  habit: Doc<"habits">;
  value: number;
  ratio: number;
  onChange: (next: number) => void;
}) {
  const step = habit.incrementStep ?? 1;
  const color = ratio >= 1 ? "#22C55E" : "#6366F1";

  if (habit.inputMode === "numeric") {
    return (
      <div className="flex items-center gap-2">
        <Ring ratio={ratio} color={color} />
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-16 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-gray-400"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(0, value - step))}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-gray-500 transition-120 hover:bg-surface-muted"
        aria-label="Decrease"
      >
        <Minus size={13} />
      </button>
      <Ring ratio={ratio} color={color} />
      <button
        onClick={() => onChange(value + step)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-gray-500 transition-120 hover:bg-surface-muted"
        aria-label="Increase"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function Ring({ ratio, color }: { ratio: number; color: string }) {
  const size = 24;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#EEE"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        animate={{ strokeDashoffset: c - Math.min(1, ratio) * c }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </svg>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1.5 text-gray-400 transition-120 hover:bg-surface-muted hover:text-gray-900"
    >
      {children}
    </button>
  );
}
