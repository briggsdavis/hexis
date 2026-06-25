"use client";

import { motion } from "framer-motion";

/**
 * Minimal Hexis mark: a single hexagon ("hex") with a small center dot.
 * The hexagon slowly draws itself and then undraws, looping every 30s — a
 * calm, minimal ambient motion. On hover the dot pulses.
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
        // One slow draw-then-undraw cycle every 30s. The trailing pause at
        // each extreme keeps the motion gentle rather than constant.
        initial={animate ? { pathLength: 0 } : false}
        animate={animate ? { pathLength: [0, 1, 1, 0, 0] } : undefined}
        transition={
          animate
            ? {
                duration: 30,
                times: [0, 0.45, 0.5, 0.95, 1],
                ease: "easeInOut",
                repeat: Infinity,
              }
            : undefined
        }
      />
      <motion.circle
        cx={12}
        cy={12}
        r={2.4}
        fill="currentColor"
        // Fade the center dot in/out in step with the hexagon draw cycle.
        animate={animate ? { opacity: [0, 1, 1, 0, 0] } : undefined}
        transition={
          animate
            ? {
                duration: 30,
                times: [0, 0.45, 0.5, 0.95, 1],
                ease: "easeInOut",
                repeat: Infinity,
              }
            : undefined
        }
        variants={{ hover: { scale: 1.5 } }}
        style={{ transformOrigin: "12px 12px" }}
      />
    </motion.svg>
  );
}
