"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMinor } from "@/lib/money";
import { ACCOUNT_CODES, ensureChartOfAccounts, postJournal } from "@/lib/accounting";
import {
  applyRentPayment,
  escalateLeaseRent,
  generateRentInvoice,
} from "@/lib/rent";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function createProperty(formData: FormData) {
  await requireAdmin();
  const property = await prisma.property.create({
    data: {
      name: str(formData, "name"),
      code: opt(formData, "code"),
      addressLine1: str(formData, "addressLine1"),
      addressLine2: opt(formData, "addressLine2"),
      city: opt(formData, "city"),
      area: opt(formData, "area"),
      propertyType: str(formData, "propertyType") || "COMMERCIAL",
      sizeSqFt: opt(formData, "sizeSqFt") ? Number(str(formData, "sizeSqFt")) : null,
      status: str(formData, "status") || "AVAILABLE",
      acquisitionDate: opt(formData, "acquisitionDate")
        ? new Date(str(formData, "acquisitionDate"))
        : null,
      acquisitionCostMinor: toMinor(str(formData, "acquisitionCost") || "0"),
      notes: opt(formData, "notes"),
    },
  });
  if (property.acquisitionCostMinor > BigInt(0)) {
    await ensureChartOfAccounts();
    await postJournal({
      memo: `Property acquisition ${property.name}`,
      sourceType: "PROPERTY_ACQUISITION",
      sourceId: property.id,
      idempotencyKey: `prop-acq-${property.id}`,
      lines: [
        {
          accountCode: ACCOUNT_CODES.PROPERTY_ASSET,
          debitMinor: property.acquisitionCostMinor,
        },
        {
          accountCode: ACCOUNT_CODES.BANK,
          creditMinor: property.acquisitionCostMinor,
        },
      ],
    });
  }
  revalidatePath("/properties");
  redirect(`/properties/${property.id}`);
}

export async function createTenant(formData: FormData) {
  await requireAdmin();
  const contactId = str(formData, "contactId");
  const tenant = await prisma.tenant.create({
    data: {
      contactId,
      notes: opt(formData, "notes"),
      status: "ACTIVE",
    },
  });
  revalidatePath("/tenants");
  redirect(`/tenants/${tenant.id}`);
}

export async function createLease(formData: FormData) {
  await requireAdmin();
  const lease = await prisma.lease.create({
    data: {
      propertyId: str(formData, "propertyId"),
      tenantId: str(formData, "tenantId"),
      status: str(formData, "status") || "ACTIVE",
      startDate: new Date(str(formData, "startDate")),
      endDate: opt(formData, "endDate") ? new Date(str(formData, "endDate")) : null,
      rentAmountMinor: toMinor(str(formData, "rentAmount") || "0"),
      dueDayOfMonth: Number(str(formData, "dueDayOfMonth") || 1),
      securityDepositMinor: toMinor(str(formData, "securityDeposit") || "0"),
      escalationPercent: Number(str(formData, "escalationPercent") || 0),
      notes: opt(formData, "notes"),
    },
  });
  await prisma.property.update({
    where: { id: lease.propertyId },
    data: { status: "OCCUPIED" },
  });
  revalidatePath("/leases");
  redirect(`/leases/${lease.id}`);
}

export async function generateInvoiceAction(formData: FormData) {
  await requireAdmin();
  const leaseId = str(formData, "leaseId");
  const period = str(formData, "periodStart") || new Date().toISOString();
  const key = str(formData, "idempotencyKey") || `inv-${leaseId}-${period.slice(0, 7)}`;
  await ensureChartOfAccounts();
  await generateRentInvoice({
    leaseId,
    periodStart: new Date(period),
    idempotencyKey: key,
  });
  revalidatePath(`/leases/${leaseId}`);
  redirect(`/leases/${leaseId}`);
}

export async function collectRentAction(formData: FormData) {
  await requireAdmin();
  const invoiceId = str(formData, "invoiceId");
  await ensureChartOfAccounts();
  await applyRentPayment({
    invoiceId,
    amountMinor: toMinor(str(formData, "amount") || "0"),
    method: str(formData, "method") || "BANK",
    reference: opt(formData, "reference") || undefined,
    idempotencyKey:
      str(formData, "idempotencyKey") ||
      `pay-${invoiceId}-${Date.now()}`,
  });
  revalidatePath("/leases");
  revalidatePath("/accounting");
}

export async function escalateRentAction(formData: FormData) {
  await requireAdmin();
  const leaseId = str(formData, "leaseId");
  await escalateLeaseRent({
    leaseId,
    effectiveDate: new Date(str(formData, "effectiveDate") || Date.now()),
    percent: Number(str(formData, "percent") || 0),
    note: opt(formData, "note") || undefined,
  });
  revalidatePath(`/leases/${leaseId}`);
  redirect(`/leases/${leaseId}`);
}

export async function createExpense(formData: FormData) {
  await requireAdmin();
  await ensureChartOfAccounts();
  const amountMinor = toMinor(str(formData, "amount") || "0");
  const expense = await prisma.expense.create({
    data: {
      title: str(formData, "title"),
      categoryId: opt(formData, "categoryId"),
      vendorId: opt(formData, "vendorId"),
      propertyId: opt(formData, "propertyId"),
      amountMinor,
      incurredOn: opt(formData, "incurredOn")
        ? new Date(str(formData, "incurredOn"))
        : new Date(),
      isRecurring: formData.get("isRecurring") === "on",
      notes: opt(formData, "notes"),
      status: "RECORDED",
    },
  });
  const journal = await postJournal({
    memo: `Expense ${expense.title}`,
    sourceType: "EXPENSE",
    sourceId: expense.id,
    idempotencyKey: `exp-${expense.id}`,
    lines: [
      { accountCode: ACCOUNT_CODES.EXPENSE, debitMinor: amountMinor },
      { accountCode: ACCOUNT_CODES.BANK, creditMinor: amountMinor },
    ],
  });
  await prisma.expense.update({
    where: { id: expense.id },
    data: { journalEntryId: journal.id },
  });
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function createWorkOrder(formData: FormData) {
  await requireAdmin();
  await prisma.workOrder.create({
    data: {
      title: str(formData, "title"),
      description: opt(formData, "description"),
      propertyId: opt(formData, "propertyId"),
      leaseId: opt(formData, "leaseId"),
      vendorId: opt(formData, "vendorId"),
      priority: str(formData, "priority") || "MEDIUM",
      dueAt: opt(formData, "dueAt") ? new Date(str(formData, "dueAt")) : null,
      costMinor: toMinor(str(formData, "cost") || "0"),
    },
  });
  revalidatePath("/maintenance");
  redirect("/maintenance");
}

export async function createPropertyTransaction(formData: FormData) {
  await requireAdmin();
  await ensureChartOfAccounts();
  const type = str(formData, "type") || "SALE";
  const agreed = toMinor(str(formData, "agreedAmount") || "0");
  const fees = toMinor(str(formData, "fees") || "0");
  const taxes = toMinor(str(formData, "taxes") || "0");
  const status = str(formData, "status") || "DRAFT";
  const propertyId = str(formData, "propertyId");

  const tx = await prisma.propertyTransaction.create({
    data: {
      type,
      propertyId,
      counterpartyContactId: opt(formData, "counterpartyContactId"),
      dealId: opt(formData, "dealId"),
      status,
      agreedAmountMinor: agreed,
      feesMinor: fees,
      taxesMinor: taxes,
      closingDate: opt(formData, "closingDate")
        ? new Date(str(formData, "closingDate"))
        : null,
      milestonesJson: opt(formData, "milestonesJson") || "[]",
      notes: opt(formData, "notes"),
    },
  });

  if (status === "COMPLETED") {
    const property = await prisma.property.findUniqueOrThrow({
      where: { id: propertyId },
    });
    if (type === "SALE") {
      const book = property.acquisitionCostMinor;
      const net = agreed;
      const gain = net - book;
      await postJournal({
        memo: `Property sale ${property.name}`,
        sourceType: "PROPERTY_SALE",
        sourceId: tx.id,
        idempotencyKey: `prop-sale-${tx.id}`,
        lines:
          gain >= BigInt(0)
            ? [
                { accountCode: ACCOUNT_CODES.BANK, debitMinor: net },
                { accountCode: ACCOUNT_CODES.PROPERTY_ASSET, creditMinor: book },
                { accountCode: ACCOUNT_CODES.GAIN_ON_SALE, creditMinor: gain },
              ]
            : [
                { accountCode: ACCOUNT_CODES.BANK, debitMinor: net },
                { accountCode: ACCOUNT_CODES.LOSS_ON_SALE, debitMinor: -gain },
                { accountCode: ACCOUNT_CODES.PROPERTY_ASSET, creditMinor: book },
              ],
      });
      await prisma.property.update({
        where: { id: propertyId },
        data: { status: "SOLD" },
      });
    } else if (type === "PURCHASE") {
      await postJournal({
        memo: `Property purchase`,
        sourceType: "PROPERTY_PURCHASE",
        sourceId: tx.id,
        idempotencyKey: `prop-buy-${tx.id}`,
        lines: [
          { accountCode: ACCOUNT_CODES.PROPERTY_ASSET, debitMinor: agreed },
          { accountCode: ACCOUNT_CODES.BANK, creditMinor: agreed },
        ],
      });
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          status: "OWNED",
          acquisitionCostMinor: agreed,
          acquisitionDate: new Date(),
        },
      });
    }
  }

  revalidatePath("/transactions");
  redirect(`/transactions/${tx.id}`);
}
