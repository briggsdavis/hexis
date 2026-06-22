"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { HoverText } from "./HoverText";

type Variant = "primary" | "ghost" | "subtle";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium",
  ghost:
    "text-gray-500 hover:bg-surface-muted px-4 py-2 rounded-lg text-sm",
  subtle:
    "text-gray-600 hover:bg-surface-muted px-3 py-1.5 rounded-lg text-sm",
};

/**
 * Standard text button with two micro-interactions on hover:
 *  - a subtle scale (springy press on tap), and
 *  - the label rolls and is replaced by an identical copy (<HoverText>).
 * Pass `icon` for a leading glyph that stays put while the label rolls.
 */
export function Button({
  children,
  icon,
  variant = "primary",
  className,
  ...props
}: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`group/btn relative inline-flex items-center justify-center gap-1.5 transition-colors ${VARIANTS[variant]} ${className ?? ""}`}
      {...(props as any)}
    >
      {icon}
      <HoverText>{children}</HoverText>
    </motion.button>
  );
}

/**
 * Icon-only button with a springy hover/tap micro-interaction. Keeps the
 * existing color/padding via `className`.
 */
export function IconButton({
  children,
  className,
  label,
  ...props
}: {
  children: ReactNode;
  label?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      aria-label={label}
      className={className}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
