"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { todayKey } from "@/lib/dates";

type ScheduleType = "daily" | "weekdays" | "weekends" | "custom";
type HabitType = "checkbox" | "quantitative" | "goal";
type GoalMode = "streak" | "progressive";
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
  const [type, setType] = useState<HabitType>(existing?.type ?? "checkbox");
  const [goalValue, setGoalValue] = useState(String(existing?.goalValue ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? "");
  const [inputMode, setInputMode] = useState<"numeric" | "increment">(
    existing?.inputMode ?? "increment",
  );
  const [incrementStep, setIncrementStep] = useState(
    String(existing?.incrementStep ?? 1),
  );

  // Goal-only state.
  const [goalMode, setGoalMode] = useState<GoalMode>(
    existing?.goalMode ?? "streak",
  );
  const [goalTargetDays, setGoalTargetDays] = useState(
    String(existing?.goalTargetDays ?? 30),
  );
  const [goalAllowedSkips, setGoalAllowedSkips] = useState(
    String(existing?.goalAllowedSkips ?? 2),
  );
  const [goalTargetValue, setGoalTargetValue] = useState(
    String(existing?.goalTargetValue ?? 100),
  );
  const [goalDeadline, setGoalDeadline] = useState(existing?.goalDeadline ?? "");
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

    // Goals aren't scheduled in the usual sense — store a daily schedule.
    const schedule =
      type === "goal"
        ? { type: "daily" as ScheduleType, days: undefined }
        : {
            type: scheduleType,
            days: scheduleType === "custom" ? customDays : undefined,
          };

    const isProgressive = type === "goal" && goalMode === "progressive";

    const quant =
      type === "quantitative"
        ? {
            goalValue: Number(goalValue) || 1,
            unit: unit.trim() || undefined,
            inputMode,
            incrementStep: Number(incrementStep) || 1,
          }
        : type === "goal"
          ? {
              // Progressive goals reuse unit/inputMode/incrementStep for logging.
              unit: isProgressive ? unit.trim() || undefined : undefined,
              inputMode: isProgressive ? inputMode : undefined,
              incrementStep: isProgressive ? Number(incrementStep) || 1 : undefined,
            }
          : {};

    const goal =
      type === "goal"
        ? {
            goalMode,
            goalStartDate: existing?.goalStartDate ?? todayKey(),
            goalTargetDays:
              goalMode === "streak" ? Number(goalTargetDays) || 1 : undefined,
            goalAllowedSkips:
              goalMode === "streak"
                ? Math.max(0, Number(goalAllowedSkips) || 0)
                : undefined,
            goalTargetValue: isProgressive ? Number(goalTargetValue) || 1 : undefined,
            goalDeadline: isProgressive && goalDeadline ? goalDeadline : undefined,
          }
        : {};

    if (existing) {
      await update({
        id: existing._id,
        name: trimmed,
        categoryId: categoryId as Id<"categories">,
        schedule,
        ...quant,
        ...goal,
      });
    } else {
      await create({
        name: trimmed,
        categoryId: categoryId as Id<"categories">,
        type,
        schedule,
        ...quant,
        ...goal,
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
          <div className="flex flex-wrap gap-2">
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
            <Toggle active={type === "goal"} onClick={() => setType("goal")}>
              Goal
            </Toggle>
          </div>
        </Field>

        {type === "goal" && (
          <>
            <Field label="Goal type">
              <div className="flex gap-2">
                <Toggle
                  active={goalMode === "streak"}
                  onClick={() => setGoalMode("streak")}
                >
                  Streak
                </Toggle>
                <Toggle
                  active={goalMode === "progressive"}
                  onClick={() => setGoalMode("progressive")}
                >
                  Progressive
                </Toggle>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                {goalMode === "streak"
                  ? "Do the same thing every day for a target number of days."
                  : "Log a value each day that accumulates toward a target total."}
              </p>
            </Field>

            {goalMode === "streak" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Target days">
                  <input
                    type="number"
                    min={1}
                    value={goalTargetDays}
                    onChange={(e) => setGoalTargetDays(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </Field>
                <Field label="Allowed skips">
                  <input
                    type="number"
                    min={0}
                    value={goalAllowedSkips}
                    onChange={(e) => setGoalAllowedSkips(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </Field>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Target total">
                    <input
                      type="number"
                      value={goalTargetValue}
                      onChange={(e) => setGoalTargetValue(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </Field>
                  <Field label="Unit">
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="cal, km, $…"
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
                <Field label="Deadline (optional)">
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
                  />
                </Field>
              </>
            )}
          </>
        )}

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

        {type !== "goal" && (
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
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
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
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "border border-border text-gray-600 hover:bg-surface-muted"
      }`}
    >
      {children}
    </motion.button>
  );
}
