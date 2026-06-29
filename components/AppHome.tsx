"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProgressPanel } from "@/components/progress/ProgressPanel";
import { WeightLossDashboard } from "@/components/weightloss/WeightLossDashboard";

/** Renders the right "Today" experience for the account type. */
export function AppHome() {
  const account = useQuery(api.accounts.current);

  if (account === undefined) {
    return <div className="flex-1" />;
  }
  if (account?.accountType === "weightLoss") {
    return <WeightLossDashboard />;
  }
  return (
    <>
      <Dashboard />
      <ProgressPanel />
    </>
  );
}
