import { prisma } from "@/lib/db";
import {
  getBusinessTimezone,
  zonedNextDaysBounds,
  zonedStartOfToday,
  zonedTodayBounds,
  zonedTomorrowBounds,
} from "@/lib/timezone";

export type TaskView =
  | "overdue"
  | "today"
  | "tomorrow"
  | "next7"
  | "next30"
  | "open"
  | "completed"
  | "unscheduled";

export async function taskWhereForView(view: TaskView) {
  const tz = await getBusinessTimezone();
  const now = new Date();
  const todayStart = zonedStartOfToday(tz, now);
  const today = zonedTodayBounds(tz, now);
  const tomorrow = zonedTomorrowBounds(tz, now);
  const next7 = zonedNextDaysBounds(7, tz, now);
  const next30 = zonedNextDaysBounds(30, tz, now);

  switch (view) {
    case "overdue":
      return {
        status: "OPEN" as const,
        dueAt: { lt: todayStart },
      };
    case "today":
      return {
        status: "OPEN" as const,
        dueAt: { gte: today.start, lte: today.end },
      };
    case "tomorrow":
      return {
        status: "OPEN" as const,
        dueAt: { gte: tomorrow.start, lte: tomorrow.end },
      };
    case "next7":
      return {
        status: "OPEN" as const,
        dueAt: { gte: next7.start, lte: next7.end },
      };
    case "next30":
      return {
        status: "OPEN" as const,
        dueAt: { gte: next30.start, lte: next30.end },
      };
    case "open":
      return { status: "OPEN" as const };
    case "completed":
      return { status: "COMPLETED" as const };
    case "unscheduled":
      return { status: "OPEN" as const, dueAt: null };
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }
}

export async function countTasksByViews() {
  const views: TaskView[] = [
    "overdue",
    "today",
    "tomorrow",
    "next7",
    "next30",
    "open",
    "completed",
    "unscheduled",
  ];
  const entries = await Promise.all(
    views.map(async (view) => {
      const where = await taskWhereForView(view);
      const count = await prisma.task.count({ where });
      return [view, count] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<TaskView, number>;
}
