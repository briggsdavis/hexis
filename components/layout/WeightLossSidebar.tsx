"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, Droplet, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { HoverText } from "@/components/ui/HoverText";
import { TopoLines } from "@/components/ui/TopoLines";

const NAV = [
  { href: "/", label: "Today", icon: Droplet },
  { href: "/history", label: "History", icon: CalendarDays },
];

/** Slim sidebar for weight-loss accounts: just Today + History. */
export function WeightLossSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  return (
    <aside className="relative isolate flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface-muted">
      <TopoLines />
      <div className="px-5 py-5">
        <Link
          href="/"
          className="group/logo inline-flex items-center gap-2 text-gray-900"
        >
          <Logo size={22} />
          <h1 className="text-lg font-semibold tracking-tight transition-transform duration-300 group-hover/logo:translate-x-0.5">
            Hexis
          </h1>
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          Weight loss
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const activeLink = pathname === href;
          return (
            <motion.div
              key={href}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={href}
                className={`group/btn flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-120 ${
                  activeLink
                    ? "bg-surface font-medium text-gray-900 shadow-card"
                    : "text-gray-600 hover:bg-surface"
                }`}
              >
                <Icon size={16} />
                <HoverText>{label}</HoverText>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        onClick={() => signOut()}
        className="group/btn flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-gray-500 transition-120 hover:text-gray-900"
      >
        <LogOut size={15} /> <HoverText>Sign out</HoverText>
      </button>
    </aside>
  );
}
