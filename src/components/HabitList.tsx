import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { todayKey } from "../lib/date";
import { HabitRow } from "./HabitRow";

export function HabitList() {
  const habits = useQuery(api.habits.list);
  const completedToday = useQuery(api.completions.listForDate, {
    date: todayKey(),
  });

  if (habits === undefined || completedToday === undefined) {
    return <p className="py-8 text-center text-gray-400">Loading…</p>;
  }

  if (habits.length === 0) {
    return (
      <p className="py-8 text-center text-gray-400">
        No habits yet. Add one above to get started.
      </p>
    );
  }

  const completedSet = new Set(completedToday);

  return (
    <div className="flex flex-col gap-3">
      {habits.map((habit) => (
        <HabitRow
          key={habit._id}
          habit={habit}
          completedToday={completedSet.has(habit._id)}
        />
      ))}
    </div>
  );
}
