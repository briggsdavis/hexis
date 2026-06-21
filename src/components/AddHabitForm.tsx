import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export function AddHabitForm() {
  const create = useMutation(api.habits.create);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await create({ name: trimmed, color, frequency });
    setName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New habit (e.g. Drink water)"
        className="flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
      />

      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use color ${c}`}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`h-6 w-6 rounded-full transition ${
              color === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" : ""
            }`}
          />
        ))}
      </div>

      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
        className="rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        Add habit
      </button>
    </form>
  );
}
