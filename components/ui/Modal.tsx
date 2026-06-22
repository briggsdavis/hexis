"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

type Size = "md" | "lg" | "xl";

const MAX_W: Record<Size, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/** Modal with backdrop blur + scale-in (PRD §18.5). */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: Size;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`clean-scroll relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-subtle ${MAX_W[size]}`}
          >
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
