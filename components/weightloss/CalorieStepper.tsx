"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

/**
 * Net-calorie input driven entirely by +/- buttons. Each press steps by
 * `step` (default 50). Positive = deficit (green), negative = surplus (red),
 * zero = even (gray). No typing — just tap toward your number.
 */
export function CalorieStepper({
  value,
  onChange,
  step = 50,
}: {
  value: number;
  onChange: (next: number) => void;
  step?: number;
}) {
  const tone =
    value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "text-gray-400";
  const label = value > 0 ? "deficit" : value < 0 ? "surplus" : "even";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";

  return (
    <div className="flex items-center justify-center gap-5">
      <StepButton onClick={() => onChange(value - step)} label="Decrease">
        <Minus size={20} />
      </StepButton>

      <div className="flex w-44 flex-col items-center">
        <span className={`text-4xl font-semibold tabular-nums ${tone}`}>
          {sign}
          {Math.abs(value).toLocaleString()}
        </span>
        <span className="mt-1 text-xs uppercase tracking-wide text-gray-400">
          {label} · cal
        </span>
      </div>

      <StepButton onClick={() => onChange(value + step)} label="Increase">
        <Plus size={20} />
      </StepButton>
    </div>
  );
}

function StepButton({
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
      type="button"
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-gray-700 shadow-card transition-120 hover:border-gray-400 hover:text-gray-900"
    >
      {children}
    </motion.button>
  );
}
