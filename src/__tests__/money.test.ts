import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addMinor,
  assertBalanced,
  fromMinor,
  invoiceStatus,
  subMinor,
  toMinor,
} from "../lib/money";

describe("money minor units", () => {
  it("converts major to minor without float drift for common amounts", () => {
    assert.equal(toMinor("250000.00"), BigInt(25_000_000));
    assert.equal(toMinor("0.30"), BigInt(30));
    assert.equal(fromMinor(BigInt(25_000_000)), "250000.00");
  });

  it("adds and subtracts as integers", () => {
    assert.equal(addMinor(100, 50, 25), BigInt(175));
    assert.equal(subMinor(250_000_00, 150_000_00), BigInt(100_000_00));
  });

  it("rejects unbalanced journals", () => {
    assert.throws(() =>
      assertBalanced([
        { debitMinor: 100, creditMinor: 0 },
        { debitMinor: 0, creditMinor: 90 },
      ]),
    );
    assert.doesNotThrow(() =>
      assertBalanced([
        { debitMinor: 100, creditMinor: 0 },
        { debitMinor: 0, creditMinor: 100 },
      ]),
    );
  });

  it("never marks fully paid while balance remains", () => {
    assert.equal(invoiceStatus(1, 100), "PARTIAL");
    assert.equal(invoiceStatus(100, 100), "OPEN");
    assert.equal(invoiceStatus(0, 100), "PAID");
    assert.equal(invoiceStatus(-5, 100), "PAID");
  });
});
