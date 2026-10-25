import { prisma } from "@/lib/db";
import { asMinor, assertBalanced, type Minor } from "@/lib/money";

export const ACCOUNT_CODES = {
  CASH: "1000",
  BANK: "1010",
  RENT_RECEIVABLE: "1100",
  PROPERTY_ASSET: "1500",
  RENT_REVENUE: "4000",
  EXPENSE: "5000",
  GAIN_ON_SALE: "4100",
  LOSS_ON_SALE: "5100",
} as const;

export async function ensureChartOfAccounts() {
  const defs: { code: string; name: string; type: string }[] = [
    { code: ACCOUNT_CODES.CASH, name: "Cash", type: "ASSET" },
    { code: ACCOUNT_CODES.BANK, name: "Bank", type: "ASSET" },
    { code: ACCOUNT_CODES.RENT_RECEIVABLE, name: "Rent receivable", type: "ASSET" },
    { code: ACCOUNT_CODES.PROPERTY_ASSET, name: "Property assets", type: "ASSET" },
    { code: ACCOUNT_CODES.RENT_REVENUE, name: "Rent revenue", type: "REVENUE" },
    { code: ACCOUNT_CODES.EXPENSE, name: "Operating expense", type: "EXPENSE" },
    { code: ACCOUNT_CODES.GAIN_ON_SALE, name: "Gain on property sale", type: "REVENUE" },
    { code: ACCOUNT_CODES.LOSS_ON_SALE, name: "Loss on property sale", type: "EXPENSE" },
  ];
  for (const def of defs) {
    await prisma.account.upsert({
      where: { code: def.code },
      create: def,
      update: { name: def.name, type: def.type, isActive: true },
    });
  }
}

async function accountId(code: string) {
  const acct = await prisma.account.findUnique({ where: { code } });
  if (!acct) throw new Error(`Missing account ${code}`);
  return acct.id;
}

export async function postJournal(opts: {
  memo: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey: string;
  entryDate?: Date;
  lines: { accountCode: string; debitMinor?: Minor | number; creditMinor?: Minor | number; memo?: string }[];
}) {
  const existing = await prisma.journalEntry.findUnique({
    where: { idempotencyKey: opts.idempotencyKey },
    include: { lines: true },
  });
  if (existing) return existing;

  const prepared = [];
  for (const line of opts.lines) {
    prepared.push({
      accountId: await accountId(line.accountCode),
      debitMinor: asMinor(line.debitMinor || 0),
      creditMinor: asMinor(line.creditMinor || 0),
      memo: line.memo,
    });
  }
  assertBalanced(prepared);

  return prisma.journalEntry.create({
    data: {
      memo: opts.memo,
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
      idempotencyKey: opts.idempotencyKey,
      entryDate: opts.entryDate || new Date(),
      lines: { create: prepared },
    },
    include: { lines: true },
  });
}

export async function trialBalance() {
  const lines = await prisma.journalLine.findMany({
    include: { account: true },
  });
  const map = new Map<
    string,
    { code: string; name: string; type: string; debit: Minor; credit: Minor }
  >();
  for (const line of lines) {
    const row = map.get(line.accountId) || {
      code: line.account.code,
      name: line.account.name,
      type: line.account.type,
      debit: BigInt(0),
      credit: BigInt(0),
    };
    row.debit += line.debitMinor;
    row.credit += line.creditMinor;
    map.set(line.accountId, row);
  }
  const rows = [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  const totalDebit = rows.reduce((s, r) => s + r.debit, BigInt(0));
  const totalCredit = rows.reduce((s, r) => s + r.credit, BigInt(0));
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}
