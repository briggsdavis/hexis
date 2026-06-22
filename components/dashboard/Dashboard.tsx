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
import { Button } from "@/components/ui/Button";
import { RiseGroup, RiseItem } from "@/components/ui/Rise";

export function Dashboard() {
  const today = todayKey();
  const categories = useQuery(api.categories.list);
  const habits = useQuery(api.habits.list);
  const goals = useQuery(api.goals.list);
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

  // goal habitId -> computed progress.
  const goalProgress = useMemo(() => {
    const m = new Map<string, any>();
    for (const g of goals ?? []) m.set(g.habitId, g);
    return m;
  }, [goals]);

  // Active categories with at least one habit scheduled today or any goal.
  const sections = useMemo(() => {
    if (!categories || !habits) return [];
    const activeCats = categories.filter((c) => !c.archived);
    return activeCats
      .map((cat) => ({
        category: cat,
        habits: habits
          .filter(
            (h) =>
              h.type !== "goal" &&
              h.categoryId === cat._id &&
              !h.paused &&
              isScheduledOn(h.schedule, today),
          )
          .sort((a, b) => a.order - b.order),
        goals: habits
          .filter(
            (h) => h.type === "goal" && h.categoryId === cat._id && !h.paused,
          )
          .sort((a, b) => a.order - b.order),
      }))
      .filter((s) => s.habits.length > 0 || s.goals.length > 0);
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
      <RiseGroup>
      <RiseItem>
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
          <Button onClick={() => setHabitModal({})} icon={<Plus size={15} />}>
            New habit
          </Button>
        </div>
      </header>
      </RiseItem>

      {loading ? (
        <p className="py-12 text-center text-gray-400">Loading…</p>
      ) : (
        <>
          <RiseItem>
          <div data-interactive>
            <h2 className="mb-1 text-sm font-semibold text-gray-800">
              Habits &amp; Goals
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
                    goals={s.goals}
                    values={values}
                    goalProgress={goalProgress}
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
          </RiseItem>

          <RiseItem>
          <div data-interactive>
            <TasksArea
              tasks={tasks ?? []}
              date={today}
              creating={creatingTask}
              onCreatingChange={setCreatingTask}
            />
          </div>
          </RiseItem>
        </>
      )}
      </RiseGroup>

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
