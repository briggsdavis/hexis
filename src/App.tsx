import { AddHabitForm } from "./components/AddHabitForm";
import { HabitList } from "./components/HabitList";

export default function App() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hexis</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {today}
        </p>
      </header>

      <main className="flex flex-col gap-6">
        <AddHabitForm />
        <HabitList />
      </main>

      <footer className="mt-12 text-center text-xs text-gray-400">
        Built with React + Convex
      </footer>
    </div>
  );
}
