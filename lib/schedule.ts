import { parseKey } from "./dates";

type Schedule = {
  type: "daily" | "weekdays" | "weekends" | "custom";
  days?: number[];
};

/** Mirror of the server scheduling check (PRD §10). */
export function isScheduledOn(schedule: Schedule, dateKey: string): boolean {
  const dow = parseKey(dateKey).getDay(); // 0=Sun … 6=Sat
  switch (schedule.type) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "custom":
      return schedule.days?.includes(dow) ?? false;
  }
}

export function scheduleLabel(schedule: Schedule): string {
  switch (schedule.type) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekends":
      return "Weekends";
    case "custom": {
      const names = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      return (schedule.days ?? []).map((d) => names[d]).join(" ") || "Custom";
    }
  }
}
