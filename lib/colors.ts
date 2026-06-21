/** Completion → color mapping (PRD §13). */
export function completionColor(ratio: number): string {
  const pct = ratio * 100;
  if (pct <= 25) return "#EF4444"; // red
  if (pct <= 50) return "#F97316"; // orange
  if (pct <= 75) return "#EAB308"; // yellow
  return "#22C55E"; // green
}

/** A pleasant default palette for new categories. */
export const CATEGORY_COLORS = [
  "#6366F1", // indigo
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#F97316", // orange
  "#3B82F6", // blue
];

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
