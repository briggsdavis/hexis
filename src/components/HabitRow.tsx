import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { todayKey } from "../lib/date";

export function HabitRow({
  habit,
  completedToday,
}: {
  habit: Doc<"habits">;
  completedToday: boolean;
}) {
  const toggle = useMutation(api.completions.toggle);
  const archive = useMutation(api.habits.archive);
  const today = todayKey();

  const streak = useQuery(api.completions.streak, {
    habitId: habit._id,
    today,
  });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button
        onClick={() => toggle({ habitId: habit._id, date: today })}
        aria-pressed={completedToday}
        aria-label={`Mark ${habit.name} ${completedToday ? "incomplete" : "complete"}`}
        style={{
          backgroundColor: completedToday ? habit.color : "transparent",
          borderColor: habit.color,
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-white transition"
      >
        {completedToday ? "✓" : ""}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{habit.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {habit.frequency === "daily" ? "Daily" : "Weekly"}
          {streak ? ` · 🔥 ${streak} day streak` : ""}
        </p>
      </div>

      <button
        onClick={() => archive({ id: habit._id })}
        className="text-xs text-gray-400 transition hover:text-red-500"
      >
        Archive
      </button>
    </div>
  );
}
