import { prisma } from "@/lib/db";
import {
  addMinor,
  asMinor,
  invoiceStatus,
  subMinor,
  type Minor,
} from "@/lib/money";
import { ACCOUNT_CODES, postJournal } from "@/lib/accounting";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";

export async function generateRentInvoice(opts: {
  leaseId: string;
  periodStart: Date;
  dueDate?: Date;
  idempotencyKey: string;
}) {
  const existing = await prisma.rentInvoice.findUnique({
    where: { idempotencyKey: opts.idempotencyKey },
  });
  if (existing) return existing;

  const lease = await prisma.lease.findUnique({ where: { id: opts.leaseId } });
  if (!lease) throw new Error("Lease not found");
  if (lease.status !== "ACTIVE") throw new Error("Lease is not active");

  const periodStart = startOfMonth(opts.periodStart);
  const periodEnd = endOfMonth(periodStart);
  const amountMinor = lease.rentAmountMinor;
  const dueDate =
    opts.dueDate ||
    new Date(
      periodStart.getFullYear(),
      periodStart.getMonth(),
      Math.min(lease.dueDayOfMonth, 28),
    );

  const invoice = await prisma.rentInvoice.create({
    data: {
      leaseId: lease.id,
      propertyId: lease.propertyId,
      periodStart,
      periodEnd,
      dueDate,
      amountMinor,
      balanceMinor: amountMinor,
      status: "OPEN",
      idempotencyKey: opts.idempotencyKey,
    },
  });

  await postJournal({
    memo: `Rent receivable ${invoice.id}`,
    sourceType: "RENT_INVOICE",
    sourceId: invoice.id,
    idempotencyKey: `je-rent-inv-${opts.idempotencyKey}`,
    entryDate: dueDate,
    lines: [
      {
        accountCode: ACCOUNT_CODES.RENT_RECEIVABLE,
        debitMinor: amountMinor,
      },
      {
        accountCode: ACCOUNT_CODES.RENT_REVENUE,
        creditMinor: amountMinor,
      },
    ],
  });

  return invoice;
}

export async function applyRentPayment(opts: {
  invoiceId: string;
  amountMinor: Minor | number;
  method?: string;
  reference?: string;
  notes?: string;
  idempotencyKey: string;
  isReversal?: boolean;
  reversesPaymentId?: string;
}) {
  const existing = await prisma.rentPayment.findUnique({
    where: { idempotencyKey: opts.idempotencyKey },
  });
  if (existing) return existing;

  const amount = asMinor(opts.amountMinor);
  if (amount <= BigInt(0)) throw new Error("Payment amount must be positive");

  const invoice = await prisma.rentInvoice.findUnique({
    where: { id: opts.invoiceId },
  });
  if (!invoice) throw new Error("Invoice not found");

  let applied: Minor;
  let newBalance: Minor;
  if (opts.isReversal) {
    applied = amount;
    newBalance = addMinor(invoice.balanceMinor, applied);
  } else {
    applied = amount < invoice.balanceMinor ? amount : invoice.balanceMinor;
    newBalance = subMinor(invoice.balanceMinor, applied);
  }

  const status =
    newBalance <= BigInt(0) ? "PAID" : invoiceStatus(newBalance, invoice.amountMinor);

  const journal = await postJournal({
    memo: opts.isReversal
      ? `Rent payment reversal`
      : `Rent payment for invoice ${invoice.id}`,
    sourceType: "RENT_PAYMENT",
    sourceId: opts.idempotencyKey,
    idempotencyKey: `je-rent-pay-${opts.idempotencyKey}`,
    lines: opts.isReversal
      ? [
          { accountCode: ACCOUNT_CODES.RENT_RECEIVABLE, debitMinor: applied },
          { accountCode: ACCOUNT_CODES.BANK, creditMinor: applied },
        ]
      : [
          { accountCode: ACCOUNT_CODES.BANK, debitMinor: applied },
          {
            accountCode: ACCOUNT_CODES.RENT_RECEIVABLE,
            creditMinor: applied,
          },
        ],
  });

  const payment = await prisma.rentPayment.create({
    data: {
      invoiceId: invoice.id,
      amountMinor: amount,
      method: opts.method || "BANK",
      reference: opts.reference,
      notes: opts.notes,
      isReversal: Boolean(opts.isReversal),
      reversesPaymentId: opts.reversesPaymentId,
      idempotencyKey: opts.idempotencyKey,
      journalEntryId: journal.id,
    },
  });

  await prisma.rentInvoice.update({
    where: { id: invoice.id },
    data: {
      balanceMinor: newBalance,
      status,
    },
  });

  return payment;
}

export async function escalateLeaseRent(opts: {
  leaseId: string;
  effectiveDate: Date;
  percent?: number;
  newRentMinor?: Minor | number;
  note?: string;
}) {
  const lease = await prisma.lease.findUnique({ where: { id: opts.leaseId } });
  if (!lease) throw new Error("Lease not found");
  const previous = lease.rentAmountMinor;
  const percent = opts.percent ?? lease.escalationPercent;
  const newRent =
    opts.newRentMinor != null
      ? asMinor(opts.newRentMinor)
      : BigInt(Math.round(Number(previous) * (1 + percent / 100)));

  await prisma.rentEscalation.create({
    data: {
      leaseId: lease.id,
      effectiveDate: opts.effectiveDate,
      previousRentMinor: previous,
      newRentMinor: newRent,
      percent,
      note: opts.note,
    },
  });

  return prisma.lease.update({
    where: { id: lease.id },
    data: { rentAmountMinor: newRent },
  });
}

export function nextPeriodStart(from: Date) {
  return startOfMonth(addMonths(from, 1));
}
