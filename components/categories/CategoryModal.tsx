"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { IconPicker } from "./IconPicker";
import { CATEGORY_COLORS } from "@/lib/colors";

type Existing = {
  id: Id<"categories">;
  name: string;
  color: string;
  icon: string;
};

/** Create or edit a category / subcategory (PRD §5). */
export function CategoryModal({
  open,
  onClose,
  parentId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  parentId?: Id<"categories">;
  existing?: Existing;
}) {
  const create = useMutation(api.categories.create);
  const update = useMutation(api.categories.update);

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(existing?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? "target");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (existing) {
        await update({ id: existing.id, name: trimmed, color, icon });
      } else {
        await create({ name: trimmed, color, icon, parentId });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  const title = existing
    ? "Edit category"
    : parentId
      ? "New subcategory"
      : "New category";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Name
          </label>
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="e.g. Health"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Color
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full transition-120 ${
                  color === c ? "ring-2 ring-gray-400 ring-offset-2" : ""
                }`}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Icon
          </label>
          <IconPicker value={icon} onChange={setIcon} color={color} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 transition-120 hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-120 hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
