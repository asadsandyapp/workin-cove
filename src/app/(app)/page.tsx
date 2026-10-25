import Link from "next/link";
import { prisma } from "@/lib/db";
import { countTasksByViews } from "@/lib/tasks";
import { trialBalance } from "@/lib/accounting";
import { formatMinor } from "@/lib/money";
import { formatMoney, fullName } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { MeterRow, SectionPanel } from "@/components/section-panel";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [
    settings,
    newLeads,
    leadsBySource,
    openDeals,
    dealValue,
    taskCounts,
    recentActivities,
    workspaceSummaries,
    stages,
    wonDeals,
    lostDeals,
    convertedLeads,
    totalLeads,
    contactedLeads,
    propertyCounts,
    activeLeases,
    openInvoices,
    overdueInvoiceBalance,
    openWorkOrders,
    expenseMonth,
    tb,
  ] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "default" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.deal.count({ where: { status: "OPEN" } }),
    prisma.deal.aggregate({
      where: { status: "OPEN" },
      _sum: { value: true },
    }),
    countTasksByViews(),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { lead: true, contact: true, deal: true },
    }),
    prisma.workspace.findMany({
      include: {
        _count: {
          select: { leads: true, deals: true, tasks: true, contacts: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.stage.findMany({
      where: { pipeline: { isDefault: true } },
      include: { _count: { select: { deals: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.deal.count({ where: { status: "WON" } }),
    prisma.deal.count({ where: { status: "LOST" } }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CONTACTED" } }),
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lease.count({ where: { status: "ACTIVE" } }),
    prisma.rentInvoice.count({ where: { status: { in: ["OPEN", "PARTIAL"] } } }),
    prisma.rentInvoice.aggregate({
      where: { status: { in: ["OPEN", "PARTIAL"] }, dueDate: { lt: new Date() } },
      _sum: { balanceMinor: true },
    }),
    prisma.workOrder.count({ where: { status: "OPEN" } }),
    prisma.expense.aggregate({
      where: {
        archivedAt: null,
        incurredOn: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amountMinor: true },
      _count: { _all: true },
    }),
    trialBalance().catch(() => ({
      rows: [],
      totalDebit: BigInt(0),
      totalCredit: BigInt(0),
      balanced: true,
    })),
  ]);

  const conversionRate =
    totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100);
  const closed = wonDeals + lostDeals;
  const winRate = closed === 0 ? 0 : Math.round((wonDeals / closed) * 100);
  const sourceMax = Math.max(1, ...leadsBySource.map((r) => r._count._all));
  const stageMax = Math.max(1, ...stages.map((s) => s._count.deals));
  const occupied =
    propertyCounts.find((p) => p.status === "OCCUPIED")?._count._all ?? 0;
  const available =
    propertyCounts.find((p) => p.status === "AVAILABLE")?._count._all ?? 0;
  const totalProperties = propertyCounts.reduce((s, p) => s + p._count._all, 0);
  const occupancyRate =
    totalProperties === 0 ? 0 : Math.round((occupied / totalProperties) * 100);

  const tz = settings?.businessTimezone ?? "Asia/Karachi";
  const nowLabel = new Date().toLocaleString("en-PK", { timeZone: tz });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Executive overview"
        title="Operations dashboard"
        description={`Live CRM, property, and finance signals · ${tz} · as of ${nowLabel}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Executive dashboard" },
        ]}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            CRM performance
          </h2>
          <Link href="/reports" className="text-xs font-medium text-teal-800 hover:underline">
            Open full reports
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            label="New leads"
            value={String(newLeads)}
            hint="Awaiting qualification"
            href="/leads?status=NEW"
          />
          <KpiCard
            label="Pipeline value"
            value={formatMoney(dealValue._sum.value ?? 0)}
            hint={`${openDeals} open deals`}
            href="/deals?status=OPEN"
          />
          <KpiCard
            label="Conversion rate"
            value={`${conversionRate}%`}
            hint={`${convertedLeads} / ${totalLeads} leads`}
            href="/leads?status=CONVERTED"
            tone="success"
          />
          <KpiCard
            label="Win rate"
            value={`${winRate}%`}
            hint={`${wonDeals} won · ${lostDeals} lost`}
            href="/deals"
          />
          <KpiCard
            label="Overdue tasks"
            value={String(taskCounts.overdue)}
            hint="Requires immediate action"
            href="/tasks?view=overdue"
            tone={taskCounts.overdue > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Today's follow-ups"
            value={String(taskCounts.today)}
            hint={`${taskCounts.tomorrow} tomorrow`}
            href="/tasks?view=today"
            tone="warning"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Property & collections
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Occupancy"
            value={`${occupancyRate}%`}
            hint={`${occupied} occupied · ${available} available`}
            href="/properties"
          />
          <KpiCard
            label="Active leases"
            value={String(activeLeases)}
            hint="Rent-bearing contracts"
            href="/leases"
          />
          <KpiCard
            label="Open rent invoices"
            value={String(openInvoices)}
            hint={`Overdue bal. ${formatMinor(overdueInvoiceBalance._sum.balanceMinor ?? BigInt(0))}`}
            href="/leases"
            tone={Number(overdueInvoiceBalance._sum.balanceMinor ?? 0n) > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Open work orders"
            value={String(openWorkOrders)}
            hint="Maintenance backlog"
            href="/maintenance"
            tone={openWorkOrders > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Finance controls
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="MTD expenses"
            value={formatMinor(expenseMonth._sum.amountMinor ?? BigInt(0))}
            hint={`${expenseMonth._count._all} postings this month`}
            href="/expenses"
          />
          <KpiCard
            label="Trial balance"
            value={tb.balanced ? "Balanced" : "Out of balance"}
            hint={`Dr ${formatMinor(tb.totalDebit)} / Cr ${formatMinor(tb.totalCredit)}`}
            href="/accounting"
            tone={tb.balanced ? "success" : "danger"}
          />
          <KpiCard
            label="Contacted leads"
            value={String(contactedLeads)}
            hint="In nurture"
            href="/leads?status=CONTACTED"
          />
          <KpiCard
            label="Open task queue"
            value={String(taskCounts.open)}
            hint={`${taskCounts.unscheduled} unscheduled`}
            href="/tasks?view=open"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionPanel
          title="Lead source mix"
          description="Click a source to open the filtered CRM list"
          actionHref="/leads"
          actionLabel="All leads"
        >
          <div className="space-y-1">
            {leadsBySource.map((row) => (
              <MeterRow
                key={row.source}
                label={row.source}
                value={row._count._all}
                max={sourceMax}
                href={`/leads?source=${encodeURIComponent(row.source)}`}
              />
            ))}
            {!leadsBySource.length ? (
              <p className="text-sm text-slate-500">No leads yet.</p>
            ) : null}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Pipeline stage distribution"
          description="Default sales pipeline"
          actionHref="/deals"
          actionLabel="Pipeline board"
        >
          <div className="space-y-1">
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
          </div>
        </SectionPanel>

        <SectionPanel
          title="Task command center"
          description={`Timezone ${tz}`}
          actionHref="/tasks"
          actionLabel="Task manager"
        >
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["overdue", "Overdue", taskCounts.overdue],
                ["today", "Today", taskCounts.today],
                ["tomorrow", "Tomorrow", taskCounts.tomorrow],
                ["next7", "Next 7 days", taskCounts.next7],
                ["next30", "Next 30 days", taskCounts.next30],
                ["unscheduled", "Unscheduled", taskCounts.unscheduled],
              ] as const
            ).map(([view, label, count]) => (
              <Link
                key={view}
                href={`/tasks?view=${view}`}
                className="rounded-md border border-slate-100 px-3 py-3 hover:bg-slate-50"
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{count}</p>
              </Link>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel
          title="Workspace performance"
          description="Operational contexts — not properties"
          actionHref="/workspaces"
          actionLabel="Manage workspaces"
        >
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-3 py-2 font-medium">Leads</th>
                  <th className="px-3 py-2 font-medium">Deals</th>
                  <th className="px-3 py-2 font-medium">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {workspaceSummaries.map((ws) => (
                  <tr key={ws.id} className="border-t border-slate-100">
                    <td className="px-3 py-2.5">
                      <Link href={`/workspaces/${ws.id}`} className="font-medium text-teal-900 hover:underline">
                        {ws.name}
                      </Link>
                      <div className="text-xs text-slate-500">{ws.code || "—"}</div>
                    </td>
                    <td className="px-3 py-2.5">{ws._count.leads}</td>
                    <td className="px-3 py-2.5">{ws._count.deals}</td>
                    <td className="px-3 py-2.5">{ws._count.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Activity timeline"
          description="Recent CRM and operations events"
          actionHref="/search"
          actionLabel="Search records"
        >
          <ol className="space-y-3">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{activity.type}</Badge>
                  <span className="text-xs text-slate-500">
                    {activity.createdAt.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-800">{activity.summary}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activity.lead
                    ? fullName(activity.lead.firstName, activity.lead.lastName)
                    : ""}
                  {activity.contact
                    ? ` · ${fullName(activity.contact.firstName, activity.contact.lastName)}`
                    : ""}
                  {activity.deal ? ` · ${activity.deal.title}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </SectionPanel>
      </div>
    </div>
  );
}
