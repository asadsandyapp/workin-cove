import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fromZonedTime } from "date-fns-tz";
import {
  zonedNextDaysBounds,
  zonedTodayBounds,
  zonedTomorrowBounds,
} from "../lib/timezone";

describe("task timezone boundaries", () => {
  it("uses Asia/Karachi day bounds", () => {
    // 2026-03-15 10:00 in Karachi
    const now = fromZonedTime(new Date(2026, 2, 15, 10, 0, 0), "Asia/Karachi");
    const today = zonedTodayBounds("Asia/Karachi", now);
    const tomorrow = zonedTomorrowBounds("Asia/Karachi", now);
    const next7 = zonedNextDaysBounds(7, "Asia/Karachi", now);

    assert.ok(today.start < today.end);
    assert.ok(tomorrow.start.getTime() === today.end.getTime() + 1 || tomorrow.start > today.end);
    assert.ok(next7.end >= tomorrow.end);
    assert.equal(today.start.toISOString() < now.toISOString(), true);
  });
});
