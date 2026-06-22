"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { getIcon } from "@/lib/icons";
import { HabitRow } from "./HabitRow";
import { GoalRow } from "./GoalRow";
import { IconButton } from "@/components/ui/Button";

type GoalProgress = Parameters<typeof GoalRow>[0]["progress"];

/** Collapsible per-category habit section (PRD §6.1, §18.4). */
export function HabitSection({
  category,
  habits,
  goals = [],
  values,
  goalProgress,
  date,
  onAddHabit,
  onEditHabit,
}: {
  category: Doc<"categories">;
  habits: Doc<"habits">[];
  goals?: Doc<"habits">[];
  values: Map<string, number>;
  goalProgress?: Map<string, GoalProgress>;
  date: string;
  onAddHabit: () => void;
  onEditHabit: (habit: Doc<"habits">) => void;
}) {
  const [open, setOpen] = useState(true);
  const Icon = getIcon(category.icon);

  const completed = habits.filter((h) => {
    const v = values.get(h._id) ?? 0;
    return h.type === "checkbox" ? v >= 1 : v >= (h.goalValue ?? 1);
  }).length;

  return (
    <section>
      <div className="flex items-center gap-2 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-gray-400"
          >
            <ChevronRight size={16} />
          </motion.span>
          <Icon size={16} style={{ color: category.color }} />
          <span className="text-sm font-semibold text-gray-800">
            {category.name}
          </span>
          <span className="text-xs text-gray-400">
            {completed}/{habits.length}
          </span>
        </button>
        <IconButton
          onClick={onAddHabit}
          className="rounded-md p-1 text-gray-400 transition-120 hover:bg-surface-muted hover:text-gray-900"
          label={`Add habit to ${category.name}`}
        >
          <Plus size={15} />
        </IconButton>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pb-3 pl-6">
              {habits.map((habit) => (
                <HabitRow
                  key={habit._id}
                  habit={habit}
                  value={values.get(habit._id)}
                  date={date}
                  onEdit={() => onEditHabit(habit)}
                />
              ))}
              {goals.map((goal) => (
                <GoalRow
                  key={goal._id}
                  goal={goal}
                  progress={goalProgress?.get(goal._id)}
                  value={values.get(goal._id)}
                  date={date}
                  onEdit={() => onEditHabit(goal)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
