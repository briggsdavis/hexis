"use client";

import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatLong, todayKey } from "@/lib/dates";
import { isScheduledOn } from "@/lib/schedule";
import { HabitSection } from "@/components/habits/HabitSection";
import { HabitModal } from "@/components/habits/HabitModal";
import { TasksArea } from "@/components/tasks/TasksArea";

export function Dashboard() {
  const today = todayKey();
  const categories = useQuery(api.categories.list);
  const habits = useQuery(api.habits.list);
  const completions = useQuery(api.completions.listForDate, { date: today });
  const tasks = useQuery(api.tasks.listForDate, { date: today });

  const [habitModal, setHabitModal] = useState<{
    existing?: Doc<"habits">;
    categoryId?: Id<"categories">;
  } | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  // habitId -> recorded value for today.
  const values = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of completions ?? []) m.set(c.habitId, c.value);
    return m;
  }, [completions]);

  // Active categories that have at least one scheduled, non-paused habit today.
  const sections = useMemo(() => {
    if (!categories || !habits) return [];
    const activeCats = categories.filter((c) => !c.archived);
    return activeCats
      .map((cat) => ({
        category: cat,
        habits: habits
          .filter(
            (h) =>
              h.categoryId === cat._id &&
              !h.paused &&
              isScheduledOn(h.schedule, today),
          )
          .sort((a, b) => a.order - b.order),
      }))
      .filter((s) => s.habits.length > 0);
  }, [categories, habits, today]);

  const loading =
    categories === undefined ||
    habits === undefined ||
    completions === undefined ||
    tasks === undefined;

  const totalToday = sections.reduce((n, s) => n + s.habits.length, 0);
  const doneToday = sections.reduce(
    (n, s) =>
      n +
      s.habits.filter((h) => {
        const v = values.get(h._id) ?? 0;
        return h.type === "checkbox" ? v >= 1 : v >= (h.goalValue ?? 1);
      }).length,
    0,
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onDoubleClick={(e) => {
        // Double-click empty space creates a one-time task (PRD §6.2).
        if ((e.target as HTMLElement).closest("[data-interactive]")) return;
        setCreatingTask(true);
      }}
      className="clean-scroll h-screen flex-1 overflow-y-auto px-10 py-8"
    >
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Today
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatLong(today)}
          </h1>
        </div>
        <div className="flex items-center gap-4" data-interactive>
          <span className="text-sm text-gray-500">
            {doneToday} of {totalToday} complete
          </span>
          <button
            onClick={() => setHabitModal({})}
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-120 hover:bg-gray-800"
          >
            <Plus size={15} /> New habit
          </button>
        </div>
      </header>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading…</p>
      ) : (
        <>
          <div data-interactive>
            <h2 className="mb-1 text-sm font-semibold text-gray-800">
              Recurring Habits
            </h2>
            {sections.length === 0 ? (
              <EmptyHabits hasCategories={(categories?.length ?? 0) > 0} />
            ) : (
              <div className="divide-y divide-border/60">
                {sections.map((s) => (
                  <HabitSection
                    key={s.category._id}
                    category={s.category}
                    habits={s.habits}
                    values={values}
                    date={today}
                    onAddHabit={() =>
                      setHabitModal({ categoryId: s.category._id })
                    }
                    onEditHabit={(habit) => setHabitModal({ existing: habit })}
                  />
                ))}
              </div>
            )}
          </div>

          <div data-interactive>
            <TasksArea
              tasks={tasks ?? []}
              date={today}
              creating={creatingTask}
              onCreatingChange={setCreatingTask}
            />
          </div>
        </>
      )}

      {habitModal && (
        <HabitModal
          open
          onClose={() => setHabitModal(null)}
          existing={habitModal.existing}
          defaultCategoryId={habitModal.categoryId}
        />
      )}
    </motion.main>
  );
}

function EmptyHabits({ hasCategories }: { hasCategories: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center">
      <p className="text-sm text-gray-500">
        {hasCategories
          ? "No habits scheduled for today. Add one with “New habit”."
          : "Create a category in the sidebar, then add your first habit."}
      </p>
    </div>
  );
}
