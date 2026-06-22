"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Ring = { color: string; ratio: number };

/**
 * Concentric multi-ring (Apple Fitness style). Outer ring first.
 *
 * The very center is a solid white disc (a "donut hole") that never fills,
 * so the `center` label reads cleanly inside it without overlapping any ring.
 */
export function MultiRing({
  rings,
  size = 180,
  stroke = 12,
  gap = 4,
  center,
}: {
  rings: Ring[];
  size?: number;
  stroke?: number;
  gap?: number;
  center?: ReactNode;
}) {
  // Inner radius of the innermost ring → defines the white hole.
  const innermost = (size - stroke) / 2 - (rings.length - 1) * (stroke + gap);
  const holeRadius = Math.max(0, innermost - stroke / 2 - 1);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
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
        {/* White donut hole — never fills. */}
        <circle cx={size / 2} cy={size / 2} r={holeRadius} fill="#FFFFFF" />
      </svg>

      {center && (
        <div
          className="absolute flex flex-col items-center justify-center text-center"
          style={{ width: holeRadius * 2, height: holeRadius * 2 }}
        >
          {center}
        </div>
      )}
    </div>
  );
}
