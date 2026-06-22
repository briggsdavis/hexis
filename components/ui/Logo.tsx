"use client";

import { motion } from "framer-motion";

/**
 * Minimal Hexis mark: a single hexagon ("hex") with a small center dot.
 * On hover the hexagon rotates a sixth-turn and the dot pulses.
 */
export function Logo({
  size = 22,
  animate = true,
}: {
  size?: number;
  animate?: boolean;
}) {
  const points = "12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5";
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={false}
      whileHover={animate ? "hover" : undefined}
      className="shrink-0"
    >
      <motion.polygon
        points={points}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        variants={{
          hover: { rotate: 60 },
        }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        style={{ transformOrigin: "12px 12px" }}
      />
      <motion.circle
        cx={12}
        cy={12}
        r={2.4}
        fill="currentColor"
        variants={{ hover: { scale: 1.5 } }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
}
