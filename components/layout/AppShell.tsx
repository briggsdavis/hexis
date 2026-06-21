"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

/** Fixed three-column layout (PRD §4). Right column is optional. */
export function AppShell({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Sidebar />
      </motion.div>
      {children}
      {right}
    </div>
  );
}
