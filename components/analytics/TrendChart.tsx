"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Completion trend line chart. Split into its own module so it can be
 * lazy-loaded (recharts is heavy) — keeps the Analytics route's initial
 * bundle small and navigation snappy.
 */
export default function TrendChart({
  data,
}: {
  data: { date: string; completion: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          tickFormatter={(d: string) => d.slice(5)}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          width={32}
        />
        <Tooltip
          formatter={(v: number) => [`${v}%`, "Completion"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="completion"
          stroke="#6366F1"
          strokeWidth={2}
          dot={false}
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
