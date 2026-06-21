"use client";

import { motion } from "framer-motion";

type Ring = { color: string; ratio: number };

/**
 * Concentric multi-ring (Apple Fitness style, PRD §13). Outer ring first.
 */
export function MultiRing({
  rings,
  size = 180,
  stroke = 12,
  gap = 4,
}: {
  rings: Ring[];
  size?: number;
  stroke?: number;
  gap?: number;
}) {
  return (
    <svg width={size} height={size} className="-rotate-90">
      {rings.map((ring, i) => {
        const r = (size - stroke) / 2 - i * (stroke + gap);
        if (r <= 0) return null;
        const c = 2 * Math.PI * r;
        const clamped = Math.max(0, Math.min(1, ring.ratio));
        return (
          <g key={i}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeOpacity={0.12}
              strokeWidth={stroke}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c - clamped * c }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
            />
          </g>
        );
      })}
    </svg>
  );
}
