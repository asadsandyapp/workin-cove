import { addDays, endOfDay, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";

export async function getBusinessTimezone() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.businessTimezone ?? "Asia/Karachi";
}

export function zonedDayBounds(date: Date, timeZone: string) {
  const zoned = toZonedTime(date, timeZone);
  const start = fromZonedTime(startOfDay(zoned), timeZone);
  const end = fromZonedTime(endOfDay(zoned), timeZone);
  return { start, end };
}

export function zonedTodayBounds(timeZone: string, now = new Date()) {
  return zonedDayBounds(now, timeZone);
}

export function zonedTomorrowBounds(timeZone: string, now = new Date()) {
  const zoned = toZonedTime(now, timeZone);
  return zonedDayBounds(addDays(zoned, 1), timeZone);
}

export function zonedNextDaysBounds(
  days: number,
  timeZone: string,
  now = new Date(),
) {
  const today = zonedTodayBounds(timeZone, now);
  const zoned = toZonedTime(now, timeZone);
  const end = fromZonedTime(endOfDay(addDays(zoned, days - 1)), timeZone);
  return { start: today.start, end };
}

export function zonedStartOfToday(timeZone: string, now = new Date()) {
  return zonedTodayBounds(timeZone, now).start;
}
