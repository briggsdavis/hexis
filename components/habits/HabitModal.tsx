"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";

type ScheduleType = "daily" | "weekdays" | "weekends" | "custom";
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function HabitModal({
  open,
  onClose,
  existing,
  defaultCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Doc<"habits">;
  defaultCategoryId?: Id<"categories">;
}) {
  const categories = useQuery(api.categories.list);
  const create = useMutation(api.habits.create);
  const update = useMutation(api.habits.update);

  const [name, setName] = useState(existing?.name ?? "");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
    existing?.categoryId ?? defaultCategoryId ?? "",
  );
  const [type, setType] = useState<"checkbox" | "quantitative">(
    existing?.type ?? "checkbox",
  );
  const [goalValue, setGoalValue] = useState(String(existing?.goalValue ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [inputMode, setInputMode] = useState<"numeric" | "increment">(
    existing?.inputMode ?? "increment",
  );
  const [incrementStep, setIncrementStep] = useState(
    String(existing?.incrementStep ?? 1),
  );
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    existing?.schedule.type ?? "daily",
  );
  const [customDays, setCustomDays] = useState<number[]>(
    existing?.schedule.days ?? [1, 3, 5],
  );

  const activeCategories = (categories ?? []).filter((c) => !c.archived);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || !categoryId) return;

    const schedule = {
      type: scheduleType,
      days: scheduleType === "custom" ? customDays : undefined,
    };

    const quant =
      type === "quantitative"
        ? {
            goalValue: Number(goalValue) || 1,
            unit: unit.trim() || undefined,
            inputMode,
            incrementStep: Number(incrementStep) || 1,
          }
        : {
            goalValue: undefined,
            unit: undefined,
            inputMode: undefined,
            incrementStep: undefined,
          };

    if (existing) {
      await update({
        id: existing._id,
        name: trimmed,
        categoryId: categoryId as Id<"categories">,
        schedule,
        ...quant,
      });
    } else {
      await create({
        name: trimmed,
        categoryId: categoryId as Id<"categories">,
        type,
        schedule,
        ...quant,
      });
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit habit" : "New habit"}>
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meditate"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </Field>

        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value as Id<"categories">)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {activeCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.parentId ? "— " : ""}
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Type">
          <div className="flex gap-2">
            <Toggle
              active={type === "checkbox"}
              onClick={() => setType("checkbox")}
            >
              Checkbox
            </Toggle>
            <Toggle
              active={type === "quantitative"}
              onClick={() => setType("quantitative")}
            >
              Quantitative
            </Toggle>
          </div>
        </Field>

        {type === "quantitative" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal">
              <input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </Field>
            <Field label="Unit">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="steps, L, pages…"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </Field>
            <Field label="Input mode">
              <div className="flex gap-2">
                <Toggle
                  active={inputMode === "increment"}
                  onClick={() => setInputMode("increment")}
                >
                  Increment
                </Toggle>
                <Toggle
                  active={inputMode === "numeric"}
                  onClick={() => setInputMode("numeric")}
                >
                  Numeric
                </Toggle>
              </div>
            </Field>
            {inputMode === "increment" && (
              <Field label="Step">
                <input
                  type="number"
                  value={incrementStep}
                  onChange={(e) => setIncrementStep(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </Field>
            )}
          </div>
        )}

        <Field label="Schedule">
          <div className="flex flex-wrap gap-2">
            {(["daily", "weekdays", "weekends", "custom"] as ScheduleType[]).map(
              (s) => (
                <Toggle
                  key={s}
                  active={scheduleType === s}
                  onClick={() => setScheduleType(s)}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </Toggle>
              ),
            )}
          </div>
          {scheduleType === "custom" && (
            <div className="mt-2 flex gap-1">
              {DOW.map((label, i) => {
                const on = customDays.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setCustomDays((days) =>
                        on ? days.filter((d) => d !== i) : [...days, i],
                      )
                    }
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-120 ${
                      on
                        ? "bg-gray-900 text-white"
                        : "border border-border text-gray-500 hover:bg-surface-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm transition-120 ${
        active
          ? "bg-gray-900 text-white"
          : "border border-border text-gray-600 hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}
