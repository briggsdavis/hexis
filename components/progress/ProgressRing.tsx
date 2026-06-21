"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Animated SVG progress ring. Animates from 0 → value (PRD §18.1 / §18.3).
 */
export function ProgressRing({
  ratio,
  size = 64,
  stroke = 6,
  color,
  trackColor = "#F1F1F1",
  children,
  duration = 0.8,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
  duration?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
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
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - clamped * c }}
          transition={{ duration, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
