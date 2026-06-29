"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HistoryView } from "@/components/history/HistoryView";
import { WeightLossHistory } from "@/components/weightloss/WeightLossHistory";

/** Renders the right History experience for the account type. */
export function AppHistory() {
  const account = useQuery(api.accounts.current);

  if (account === undefined) {
    return <div className="flex-1" />;
  }
  if (account?.accountType === "weightLoss") {
    return <WeightLossHistory />;
  }
  return <HistoryView />;
}
