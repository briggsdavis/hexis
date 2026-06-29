"use client";

import { motion } from "framer-motion";

/**
 * A vial / test-tube that fills bottom→top with the cumulative calorie
 * progress. The liquid is clipped to the glass interior and animates as the
 * percentage changes. Percentage and "burned / goal" read out below it.
 */

// Inner liquid bounds (SVG user units). Liquid surface travels from INNER_BOTTOM
// (empty) up to INNER_TOP (full).
const INNER_TOP = 35;
const INNER_BOTTOM = 240;
const INNER_HEIGHT = INNER_BOTTOM - INNER_TOP; // 205

export function Vial({
  percent,
  reached,
  className,
}: {
  percent: number;
  reached?: boolean;
  className?: string;
}) {
  const p = Math.max(0, Math.min(1, percent));
  const fillTop = INNER_BOTTOM - p * INNER_HEIGHT;
  const fillHeight = p * INNER_HEIGHT;

  // Inner glass shape — used both to clip the liquid and to imply thickness.
  const innerPath = "M40,35 L40,210 Q40,240 70,240 Q100,240 100,210 L100,35 Z";

  return (
    <svg
      viewBox="0 0 140 270"
      className={className}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Vial ${Math.round(p * 100)} percent full`}
    >
      <defs>
        <linearGradient id="vialLiquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={reached ? "#34D399" : "#4ADE80"} />
          <stop offset="100%" stopColor={reached ? "#059669" : "#16A34A"} />
        </linearGradient>
        <clipPath id="vialClip">
          <path d={innerPath} />
        </clipPath>
      </defs>

      {/* Mouth / lip */}
      <rect
        x={28}
        y={16}
        width={84}
        height={16}
        rx={5}
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth={3}
      />

      {/* Glass body */}
      <path
        d="M35,30 L35,212 Q35,245 70,245 Q105,245 105,212 L105,30"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth={3}
        strokeLinejoin="round"
      />

      {/* Liquid (clipped to the inner shape) */}
      <g clipPath="url(#vialClip)">
        <motion.rect
          x={38}
          width={64}
          fill="url(#vialLiquid)"
          initial={false}
          animate={{ y: fillTop, height: fillHeight }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Surface sheen */}
        {p > 0.001 && (
          <motion.rect
            x={38}
            width={64}
            height={4}
            fill="#FFFFFF"
            opacity={0.35}
            initial={false}
            animate={{ y: fillTop }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </g>

      {/* Subtle vertical glass highlight */}
      <rect
        x={46}
        y={48}
        width={6}
        height={170}
        rx={3}
        fill="#FFFFFF"
        opacity={0.5}
      />
    </svg>
  );
}
