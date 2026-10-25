import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { prisma } from "../lib/db";
import { applyRentPayment, generateRentInvoice } from "../lib/rent";
import { ensureChartOfAccounts, trialBalance } from "../lib/accounting";
import { invoiceStatus } from "../lib/money";

describe("rent collection reconciliation", () => {
  let leaseId = "";

  before(async () => {
    await ensureChartOfAccounts();
    let contact = await prisma.contact.findFirst();
    if (!contact) {
      contact = await prisma.contact.create({
        data: { firstName: "Rent", lastName: "Tester" },
      });
    }
    let property = await prisma.property.findFirst();
    if (!property) {
      property = await prisma.property.create({
        data: {
          name: "Test Property",
          addressLine1: "1 Test St",
          status: "AVAILABLE",
          acquisitionCostMinor: BigInt(0),
        },
      });
    }
    let tenant = await prisma.tenant.findFirst({
      where: { contactId: contact.id },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({ data: { contactId: contact.id } });
    }
    let lease = await prisma.lease.findFirst({
      where: { propertyId: property.id, tenantId: tenant.id, status: "ACTIVE" },
    });
    if (!lease) {
      lease = await prisma.lease.create({
        data: {
          propertyId: property.id,
          tenantId: tenant.id,
          status: "ACTIVE",
          startDate: new Date(),
          rentAmountMinor: BigInt(100_000_00),
          dueDayOfMonth: 1,
        },
      });
    }
    leaseId = lease.id;
  });

  it("posts invoice and keeps partial balances accurate", async () => {
    const key = `test-inv-${Date.now()}`;
    const invoice = await generateRentInvoice({
      leaseId,
      periodStart: new Date("2031-06-01"),
      idempotencyKey: key,
    });
    assert.equal(invoice.amountMinor, invoice.balanceMinor);
    assert.equal(invoice.status, "OPEN");

    await applyRentPayment({
      invoiceId: invoice.id,
      amountMinor: BigInt(40_000_00),
      idempotencyKey: `test-pay-${key}-1`,
    });
    const mid = await prisma.rentInvoice.findUniqueOrThrow({
      where: { id: invoice.id },
    });
    assert.equal(mid.balanceMinor, BigInt(60_000_00));
    assert.equal(mid.status, "PARTIAL");
    assert.equal(invoiceStatus(mid.balanceMinor, mid.amountMinor), "PARTIAL");

    await applyRentPayment({
      invoiceId: invoice.id,
      amountMinor: BigInt(60_000_00),
      idempotencyKey: `test-pay-${key}-2`,
    });
    const done = await prisma.rentInvoice.findUniqueOrThrow({
      where: { id: invoice.id },
    });
    assert.equal(done.balanceMinor, BigInt(0));
    assert.equal(done.status, "PAID");

    const tb = await trialBalance();
    assert.equal(tb.balanced, true);
  });

  it("is idempotent on payment keys", async () => {
    const key = `test-inv-idem-${Date.now()}`;
    const invoice = await generateRentInvoice({
      leaseId,
      periodStart: new Date("2031-07-01"),
      idempotencyKey: key,
    });
    const payKey = `pay-${key}`;
    const a = await applyRentPayment({
      invoiceId: invoice.id,
      amountMinor: BigInt(10_000_00),
      idempotencyKey: payKey,
    });
    const b = await applyRentPayment({
      invoiceId: invoice.id,
      amountMinor: BigInt(10_000_00),
      idempotencyKey: payKey,
    });
    assert.equal(a.id, b.id);
    const inv = await prisma.rentInvoice.findUniqueOrThrow({
      where: { id: invoice.id },
    });
    assert.equal(inv.balanceMinor, invoice.amountMinor - BigInt(10_000_00));
  });
});
