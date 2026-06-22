"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { IconPicker } from "./IconPicker";
import { HabitModal } from "@/components/habits/HabitModal";
import { CATEGORY_COLORS } from "@/lib/colors";
import { scheduleLabel } from "@/lib/schedule";

type Existing = {
  id: Id<"categories">;
  name: string;
  color: string;
  icon: string;
};

const TYPE_LABEL: Record<Doc<"habits">["type"], string> = {
  checkbox: "Checkbox",
  quantitative: "Quantitative",
  goal: "Goal",
};

/** Create or edit a category / subcategory (PRD §5). Editing also manages habits. */
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
    <Modal open={open} onClose={onClose} title={title} size={existing ? "lg" : "md"}>
      <div className={existing ? "grid gap-6 md:grid-cols-2" : "flex flex-col gap-4"}>
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
                  className={`h-7 w-7 rounded-full transition-120 hover:scale-110 ${
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
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>

        {existing && <CategoryHabits categoryId={existing.id} />}
      </div>
    </Modal>
  );
}

/** Inline habit management for a category (only shown when editing). */
function CategoryHabits({ categoryId }: { categoryId: Id<"categories"> }) {
  const habits = useQuery(api.habits.list);
  const setPaused = useMutation(api.habits.setPaused);
  const remove = useMutation(api.habits.remove);

  const [habitModal, setHabitModal] = useState<{
    existing?: Doc<"habits">;
  } | null>(null);

  const mine = (habits ?? []).filter((h) => h.categoryId === categoryId);

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-border bg-surface-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Habits & goals
        </span>
        <Button variant="subtle" icon={<Plus size={14} />} onClick={() => setHabitModal({})}>
          Add
        </Button>
      </div>

      <div className="clean-scroll flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {habits === undefined ? (
          <p className="px-1 text-sm text-gray-400">Loading…</p>
        ) : mine.length === 0 ? (
          <p className="px-1 py-4 text-center text-sm text-gray-400">
            No habits yet. Click “Add”.
          </p>
        ) : (
          mine.map((h) => (
            <div
              key={h._id}
              className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${h.paused ? "text-gray-400" : "text-gray-800"}`}
                >
                  {h.name}
                </p>
                <p className="truncate text-xs text-gray-400">
                  {TYPE_LABEL[h.type]}
                  {h.type !== "goal" ? ` · ${scheduleLabel(h.schedule)}` : ""}
                  {h.paused ? " · Paused" : ""}
                </p>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 transition-120 group-hover:opacity-100">
                <IconButton
                  onClick={() => setPaused({ id: h._id, paused: !h.paused })}
                  className="rounded p-1 text-gray-400 hover:text-gray-900"
                  label={h.paused ? "Resume" : "Pause"}
                >
                  {h.paused ? <Play size={14} /> : <Pause size={14} />}
                </IconButton>
                <IconButton
                  onClick={() => setHabitModal({ existing: h })}
                  className="rounded p-1 text-gray-400 hover:text-gray-900"
                  label="Edit"
                >
                  <Pencil size={14} />
                </IconButton>
                <IconButton
                  onClick={() => remove({ id: h._id })}
                  className="rounded p-1 text-gray-400 hover:text-red-600"
                  label="Delete"
                >
                  <Trash2 size={14} />
                </IconButton>
              </div>
            </div>
          ))
        )}
      </div>

      {habitModal && (
        <HabitModal
          open
          onClose={() => setHabitModal(null)}
          existing={habitModal.existing}
          defaultCategoryId={categoryId}
        />
      )}
    </div>
  );
}
