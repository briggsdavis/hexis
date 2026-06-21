"use client";

import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

export function TasksArea({
  tasks,
  date,
  creating,
  onCreatingChange,
}: {
  tasks: Doc<"tasks">[];
  date: string;
  creating: boolean;
  onCreatingChange: (v: boolean) => void;
}) {
  const create = useMutation(api.tasks.create);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  async function submit() {
    const name = draft.trim();
    if (name) await create({ name, date });
    setDraft("");
    onCreatingChange(false);
  }

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-gray-800">One-Time Tasks</h2>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskRow key={task._id} task={task} date={date} />
        ))}

        {creating ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") {
                setDraft("");
                onCreatingChange(false);
              }
            }}
            placeholder="Task name, then Enter…"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-gray-400"
          />
        ) : (
          <button
            onClick={() => onCreatingChange(true)}
            className="rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm text-gray-400 transition-120 hover:border-gray-300 hover:text-gray-600"
          >
            Add a task (or double-click anywhere)
          </button>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, date }: { task: Doc<"tasks">; date: string }) {
  const toggle = useMutation(api.tasks.toggle);
  const remove = useMutation(api.tasks.remove);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
    >
      <motion.button
        onClick={() => toggle({ id: task._id, date })}
        animate={{ scale: task.completed ? 1.1 : 1 }}
        transition={{ duration: 0.08 }}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-120 ${
          task.completed
            ? "border-completion-full bg-completion-full text-white"
            : "border-gray-300 text-transparent hover:border-gray-400"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </motion.button>

      <span
        className={`flex-1 truncate text-sm strike-anim ${
          task.completed ? "struck text-gray-400" : "text-gray-800"
        }`}
      >
        {task.name}
      </span>

      <button
        onClick={() => remove({ id: task._id })}
        aria-label="Delete task"
        className="rounded-md p-1.5 text-gray-400 opacity-0 transition-120 hover:bg-surface-muted hover:text-gray-900 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
