"use client";

import { useState } from "react";
import { ICON_NAMES, getIcon } from "@/lib/icons";

/** Searchable icon picker (PRD §5). */
export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (name: string) => void;
  color: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = ICON_NAMES.filter((n) =>
    n.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search icons…"
        className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <div className="clean-scroll grid max-h-40 grid-cols-8 gap-1 overflow-y-auto pr-1">
        {filtered.map((name) => {
          const Icon = getIcon(name);
          const selected = name === value;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className={`flex aspect-square items-center justify-center rounded-lg border transition-120 ${
                selected
                  ? "border-gray-900"
                  : "border-transparent hover:bg-surface-muted"
              }`}
              style={selected ? { color } : undefined}
              aria-label={name}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
