"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export type ToastTone = "deficit" | "surplus" | "neutral";

const TONE_STYLES: Record<ToastTone, string> = {
  deficit: "border-green-200 bg-green-50 text-green-800",
  surplus: "border-amber-200 bg-amber-50 text-amber-800",
  neutral: "border-border bg-surface text-gray-700",
};

/**
 * Transient encouragement banner. Appears after a log and auto-dismisses.
 */
export function Toast({
  toast,
  onDismiss,
}: {
  toast: { id: number; text: string; tone: ToastTone } | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3600);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto rounded-full border px-5 py-2.5 text-sm font-medium shadow-subtle ${TONE_STYLES[toast.tone]}`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
