import Link from "next/link";
import { prisma } from "@/lib/db";
import { trialBalance } from "@/lib/accounting";
import { formatMinor } from "@/lib/money";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { MeterRow, SectionPanel } from "@/components/section-panel";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
  const [
    leadsByStatus,
    leadsBySource,
    dealsByStatus,
    stages,
    propertiesByStatus,
    leaseByStatus,
    invoiceByStatus,
    expensesByCategory,
    tb,
    topDeals,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.deal.groupBy({ by: ["status"], _count: { _all: true }, _sum: { value: true } }),
    prisma.stage.findMany({
      where: { pipeline: { isDefault: true } },
      include: { _count: { select: { deals: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lease.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.rentInvoice.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amountMinor: true, balanceMinor: true },
    }),
    prisma.expense.findMany({
      where: { archivedAt: null },
      include: { category: true },
      take: 200,
    }),
    trialBalance(),
    prisma.deal.findMany({
      where: { status: "OPEN" },
      orderBy: { value: "desc" },
      take: 8,
      include: { stage: true, company: true },
    }),
  ]);

  const categoryTotals = new Map<string, number>();
  for (const expense of expensesByCategory) {
    const key = expense.category?.name || "Uncategorized";
    categoryTotals.set(
      key,
      (categoryTotals.get(key) || 0) + Number(expense.amountMinor),
    );
  }
  const categoryRows = [...categoryTotals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const categoryMax = Math.max(1, ...categoryRows.map((r) => r.value));
  const leadStatusMax = Math.max(1, ...leadsByStatus.map((r) => r._count._all));
  const sourceMax = Math.max(1, ...leadsBySource.map((r) => r._count._all));
  const stageMax = Math.max(1, ...stages.map((s) => s._count.deals));

  const openDealValue = dealsByStatus.find((d) => d.status === "OPEN")?._sum.value ?? 0;
  const openDealCount = dealsByStatus.find((d) => d.status === "OPEN")?._count._all ?? 0;
  const leadTotal = leadsByStatus.reduce((n, r) => n + r._count._all, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Live breakdowns across CRM, seats, rent, and books. Click any bar or row to open the matching list."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Reports" },
        ]}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up">
        <div className="surface-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Leads
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">{leadTotal}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Across all statuses</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Open pipeline
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {formatMoney(openDealValue)}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{openDealCount} open deals</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Properties
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {propertiesByStatus.reduce((n, r) => n + r._count._all, 0)}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Inventory records</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Trial balance
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {tb.balanced ? "OK" : "Fix"}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            {tb.balanced ? "Books are balanced" : "Out of balance — open ledger"}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionPanel title="CRM · Lead status funnel" actionHref="/leads" actionLabel="Leads">
          {leadsByStatus.map((row) => (
            <MeterRow
              key={row.status}
              label={row.status}
              value={row._count._all}
              max={leadStatusMax}
              href={`/leads?status=${encodeURIComponent(row.status)}`}
            />
          ))}
        </SectionPanel>
        <SectionPanel title="CRM · Acquisition sources" actionHref="/leads" actionLabel="Sources">
          {leadsBySource.map((row) => (
            <MeterRow
              key={row.source}
              label={row.source}
              value={row._count._all}
              max={sourceMax}
              href={`/leads?source=${encodeURIComponent(row.source)}`}
            />
          ))}
        </SectionPanel>
        <SectionPanel title="CRM · Pipeline stages" actionHref="/deals" actionLabel="Deals">
          {stages.map((stage) => (
            <MeterRow
              key={stage.id}
              label={stage.name}
              value={stage._count.deals}
              max={stageMax}
              href={`/deals?stageId=${stage.id}`}
              color={stage.color}
            />
          ))}
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="CRM · Deal outcomes" actionHref="/deals" actionLabel="Deal board">
          <div className="space-y-2">
            {dealsByStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{row.status}</p>
                  <p className="text-xs text-slate-500">{row._count._all} deals</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {formatMoney(row._sum.value ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          title="CRM · Top open opportunities"
          description="Ranked by deal value"
          actionHref="/deals?status=OPEN"
          actionLabel="Open deals"
        >
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Deal</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {topDeals.map((deal) => (
                  <tr key={deal.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <Link href={`/deals/${deal.id}`} className="font-medium text-teal-900 hover:underline">
                        {deal.title}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {deal.company?.name || "No company"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline">{deal.stage.name}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {formatMoney(deal.value, deal.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionPanel title="Property inventory status" actionHref="/properties" actionLabel="Properties">
          {propertiesByStatus.map((row) => (
            <div
              key={row.status}
              className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"
            >
              <span>{row.status}</span>
              <Badge variant="secondary">{row._count._all}</Badge>
            </div>
          ))}
        </SectionPanel>
        <SectionPanel title="Lease portfolio" actionHref="/leases" actionLabel="Leases">
          {leaseByStatus.map((row) => (
            <div
              key={row.status}
              className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"
            >
              <span>{row.status}</span>
              <Badge variant="secondary">{row._count._all}</Badge>
            </div>
          ))}
        </SectionPanel>
        <SectionPanel title="Rent invoice aging snapshot" actionHref="/leases" actionLabel="Collections">
          {invoiceByStatus.map((row) => (
            <div key={row.status} className="border-b border-slate-100 py-2 text-sm last:border-0">
              <div className="flex items-center justify-between">
                <span>{row.status}</span>
                <Badge variant="secondary">{row._count._all}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Billed {formatMinor(row._sum.amountMinor ?? BigInt(0))} · Balance{" "}
                {formatMinor(row._sum.balanceMinor ?? BigInt(0))}
              </p>
            </div>
          ))}
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Expense category spend" actionHref="/expenses" actionLabel="Expenses">
          {categoryRows.map((row) => (
            <MeterRow
              key={row.label}
              label={row.label}
              value={row.value}
              max={categoryMax}
              href="/expenses"
              color="#b45309"
            />
          ))}
          {!categoryRows.length ? (
            <p className="text-sm text-slate-500">No expenses recorded.</p>
          ) : null}
        </SectionPanel>
        <SectionPanel
          title="Ledger reconciliation"
          description="Authoritative only when balanced"
          actionHref="/accounting"
          actionLabel="Open ledger"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-3">
              <span>Trial balance</span>
              <Badge variant={tb.balanced ? "success" : "danger"}>
                {tb.balanced ? "BALANCED" : "OUT OF BALANCE"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total debits</span>
              <span className="font-medium">{formatMinor(tb.totalDebit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total credits</span>
              <span className="font-medium">{formatMinor(tb.totalCredit)}</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Account</th>
                    <th className="px-3 py-2">Debit</th>
                    <th className="px-3 py-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.rows.map((row) => (
                    <tr key={row.code} className="border-t">
                      <td className="px-3 py-2">
                        {row.code} {row.name}
                      </td>
                      <td className="px-3 py-2">{formatMinor(row.debit)}</td>
                      <td className="px-3 py-2">{formatMinor(row.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
