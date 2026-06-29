"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

/**
 * Analytics is a productivity-only view. Weight-loss accounts don't have it, so
 * we bounce them back to Today if they reach this route directly.
 */
export function AppAnalytics() {
  const account = useQuery(api.accounts.current);
  const router = useRouter();

  const isWeightLoss = account?.accountType === "weightLoss";

  useEffect(() => {
    if (isWeightLoss) router.replace("/");
  }, [isWeightLoss, router]);

  if (account === undefined || isWeightLoss) {
    return <div className="flex-1" />;
  }
  return <AnalyticsView />;
}
