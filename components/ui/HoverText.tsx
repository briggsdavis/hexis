"use client";

import { ReactNode } from "react";

/**
 * Text that "rolls" on hover: the label slides up and is replaced by an
 * identical copy rising from below. The closest ancestor with the
 * `group/btn` class drives the hover state (see <Button>).
 */
export function HoverText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex overflow-hidden leading-tight ${className ?? ""}`}
    >
      <span className="inline-block transition-transform duration-300 ease-out group-hover/btn:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-full inline-block transition-transform duration-300 ease-out group-hover/btn:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}
