"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Droplet, LayoutGrid } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/ui/Logo";

type AccountType = "productivity" | "weightLoss";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const setType = useMutation(api.accounts.setType);
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [accountType, setAccountType] = useState<AccountType>("productivity");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    try {
      await signIn("password", form);
      // Record the chosen account type right after sign-up. Idempotent, so a
      // repeat sign-in won't change an existing account.
      if (flow === "signUp") {
        await setType({ type: accountType });
      }
      router.push("/");
    } catch (err) {
      // Surface the real reason where we can (e.g. password too short,
      // account already exists) and fall back to a friendly hint.
      const raw = err instanceof Error ? err.message : "";
      const friendly = /password/i.test(raw)
        ? "Your password must be at least 8 characters."
        : /exist|already/i.test(raw)
          ? "An account with that email already exists — try signing in."
          : raw ||
            (flow === "signIn"
              ? "Couldn't sign in. Check your email and password."
              : "Couldn't create that account. Try again.");
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-subtle"
      >
        <div className="flex items-center gap-2 text-gray-900">
          <Logo size={26} />
          <h1 className="text-2xl font-semibold tracking-tight">Hexis</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {flow === "signIn"
            ? "Welcome back. Sign in to continue."
            : "Create your account to get started."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <input
            name="password"
            type="password"
            required
            autoComplete={
              flow === "signIn" ? "current-password" : "new-password"
            }
            placeholder="Password"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gray-400"
          />

          {flow === "signUp" && (
            <div className="mt-1">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                Account type
              </p>
              <div className="grid grid-cols-2 gap-2">
                <AccountOption
                  selected={accountType === "productivity"}
                  onSelect={() => setAccountType("productivity")}
                  icon={<LayoutGrid size={16} />}
                  title="Productivity"
                  desc="Habits, goals & streaks"
                />
                <AccountOption
                  selected={accountType === "weightLoss"}
                  onSelect={() => setAccountType("weightLoss")}
                  icon={<Droplet size={16} />}
                  title="Weight loss"
                  desc="Calorie deficit & vial"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-120 hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting
              ? "Please wait…"
              : flow === "signIn"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="mt-4 text-sm text-gray-500 transition-120 hover:text-gray-900"
        >
          {flow === "signIn"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}

function AccountOption({
  selected,
  onSelect,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-120 ${
        selected
          ? "border-gray-900 bg-surface-muted"
          : "border-border hover:border-gray-400"
      }`}
    >
      {selected && (
        <CheckCircle2
          size={15}
          className="absolute right-2 top-2 text-gray-900"
        />
      )}
      <span className="text-gray-700">{icon}</span>
      <span className="text-sm font-medium text-gray-900">{title}</span>
      <span className="text-xs text-gray-400">{desc}</span>
    </button>
  );
}
