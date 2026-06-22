"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
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
