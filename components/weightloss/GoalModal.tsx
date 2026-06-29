"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/** Set or edit the cumulative calorie goal the vial fills toward. */
export function GoalModal({
  open,
  current,
  onClose,
}: {
  open: boolean;
  current: number;
  onClose: () => void;
}) {
  const setGoal = useMutation(api.weightLoss.setGoal);
  const [value, setValue] = useState(String(current || ""));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Math.max(0, Math.round(Number(value) || 0));
    setSaving(true);
    try {
      await setGoal({ goal: n });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Calorie goal">
      <p className="text-sm text-gray-500">
        The total calories you want to burn. The vial fills as your daily
        deficits add up — a surplus day nudges it back down.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={50}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="e.g. 30000"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
        <span className="text-sm text-gray-400">cal</span>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save goal"}
        </Button>
      </div>
    </Modal>
  );
}
