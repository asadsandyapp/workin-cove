import Link from "next/link";
import { prisma } from "@/lib/db";
import { countTasksByViews, taskWhereForView } from "@/lib/tasks";
import { trialBalance } from "@/lib/accounting";
import { formatMinor } from "@/lib/money";
import { formatMoney, fullName } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";

function ActionRow({
  title,
  detail,
  href,
  urgency = "normal",
}: {
  title: string;
  detail: string;
  href: string;
  urgency?: "normal" | "high" | "done";
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-5 py-4 last:border-0 transition hover:bg-[var(--surface-muted)]"
    >
      <div>
        <p className="text-[15px] font-semibold text-[var(--ink)] group-hover:text-[var(--brand-strong)]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{detail}</p>
      </div>
      <Badge
        variant={
          urgency === "high" ? "danger" : urgency === "done" ? "success" : "secondary"
        }
      >
        {urgency === "high" ? "Do now" : urgency === "done" ? "OK" : "Open"}
      </Badge>
    </Link>
  );
}

export default async function DashboardPage() {
  const [
    settings,
    newLeads,
    openDeals,
    dealValue,
    taskCounts,
    overdueInvoices,
    openWorkOrders,
    tb,
    recentLeads,
    todayTasks,
    activeSeats,
  ] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "default" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.deal.count({ where: { status: "OPEN" } }),
    prisma.deal.aggregate({ where: { status: "OPEN" }, _sum: { value: true } }),
    countTasksByViews(),
    prisma.rentInvoice.count({
      where: { status: { in: ["OPEN", "PARTIAL"] }, dueDate: { lt: new Date() } },
    }),
    prisma.workOrder.count({ where: { status: "OPEN" } }),
    trialBalance().catch(() => ({
      balanced: true,
      totalDebit: BigInt(0),
      totalCredit: BigInt(0),
    })),
    prisma.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    taskWhereForView("today").then((where) =>
      prisma.task.findMany({
        where,
        take: 5,
        orderBy: { dueAt: "asc" },
      }),
    ),
    prisma.seatMembership.count({ where: { status: "ACTIVE" } }).catch(() => 0),
  ]);

  const tz = settings?.businessTimezone ?? "Asia/Karachi";
  const urgentCount =
    (taskCounts.overdue > 0 ? 1 : 0) +
    (newLeads > 0 ? 1 : 0) +
    (overdueInvoices > 0 ? 1 : 0) +
    (tb.balanced ? 0 : 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="surface-card animate-fade-up overflow-hidden">
        <div className="relative px-6 py-7 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,111,104,0.14),transparent_45%)]" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {settings?.companyName ?? "Workin Cove"} · Home
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
              What should I do today?
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
              Start with the action queue. Left menu groups are folders: CRM for people & sales,
              Property for seats & rent, Operations for costs, Finance for books. Timezone: {tz}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="soft-chip bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                {urgentCount} priority item{urgentCount === 1 ? "" : "s"}
              </span>
              <span className="soft-chip bg-white text-[var(--ink-soft)] ring-1 ring-[var(--line-soft)]">
                {activeSeats} active seat membership{activeSeats === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 animate-fade-up-delay">
        <KpiCard
          label="Open pipeline"
          value={formatMoney(dealValue._sum.value ?? 0)}
          hint={`${openDeals} open deals`}
          href="/deals"
        />
        <KpiCard
          label="Task load"
          value={String(taskCounts.open)}
          hint={`${taskCounts.unscheduled} unscheduled · ${taskCounts.next7} next 7 days`}
          href="/tasks?view=open"
          tone={taskCounts.overdue > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Books"
          value={tb.balanced ? "Balanced" : "Fix now"}
          hint={`Debits ${formatMinor(tb.totalDebit)} · Credits ${formatMinor(tb.totalCredit)}`}
          href="/accounting"
          tone={tb.balanced ? "success" : "danger"}
        />
      </section>

      <section className="surface-card animate-fade-up overflow-hidden">
        <div className="border-b border-[var(--line-soft)] bg-[var(--surface-muted)]/80 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Action queue</h2>
          <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
            Highest priority first. Click a row to open the right screen.
          </p>
        </div>
        <div>
          <ActionRow
            title={`${taskCounts.overdue} overdue task${taskCounts.overdue === 1 ? "" : "s"}`}
            detail="Complete or reschedule these before new work."
            href="/tasks?view=overdue"
            urgency={taskCounts.overdue > 0 ? "high" : "done"}
          />
          <ActionRow
            title={`${newLeads} new lead${newLeads === 1 ? "" : "s"} waiting`}
            detail="Qualify, contact, or convert to a customer."
            href="/leads?status=NEW"
            urgency={newLeads > 0 ? "high" : "done"}
          />
          <ActionRow
            title={`${taskCounts.today} follow-up${taskCounts.today === 1 ? "" : "s"} due today`}
            detail="Calls, meetings, and reminders for today."
            href="/tasks?view=today"
            urgency={taskCounts.today > 0 ? "normal" : "done"}
          />
          <ActionRow
            title={`${overdueInvoices} overdue rent invoice${overdueInvoices === 1 ? "" : "s"}`}
            detail="Collect outstanding rent from leases."
            href="/leases"
            urgency={overdueInvoices > 0 ? "high" : "done"}
          />
          <ActionRow
            title={`${openWorkOrders} open maintenance job${openWorkOrders === 1 ? "" : "s"}`}
            detail="Property work orders still open."
            href="/maintenance"
            urgency={openWorkOrders > 0 ? "normal" : "done"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-[var(--ink)]">
          Browse by module
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_GROUPS.map((group) => (
            <Link
              key={group.id}
              href={group.href}
              className="surface-card p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]/35"
            >
              <p className="font-semibold text-[var(--ink)]">{group.label}</p>
              <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{group.blurb}</p>
              <p className="mt-4 text-xs text-[var(--ink-soft)]">
                {group.items.map((i) => i.label).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-card overflow-hidden">
          <div className="border-b border-[var(--line-soft)] px-5 py-4">
            <h2 className="font-display text-base font-semibold">New leads to review</h2>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-[var(--surface-muted)]"
              >
                <span className="font-medium text-[var(--ink)]">
                  {fullName(lead.firstName, lead.lastName)}
                </span>
                <span className="text-xs text-[var(--ink-soft)]">{lead.source}</span>
              </Link>
            ))}
            {!recentLeads.length ? (
              <p className="px-5 py-8 text-sm text-[var(--ink-soft)]">No new leads.</p>
            ) : null}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-[var(--line-soft)] px-5 py-4">
            <h2 className="font-display text-base font-semibold">Today&apos;s tasks</h2>
          </div>
          <div className="divide-y divide-[var(--line-soft)]">
            {todayTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks?view=today"
                className="block px-5 py-3.5 text-sm hover:bg-[var(--surface-muted)]"
              >
                <p className="font-medium text-[var(--ink)]">{task.title}</p>
                <p className="text-xs text-[var(--ink-soft)]">
                  {task.type}
                  {task.dueAt ? ` · ${task.dueAt.toLocaleString()}` : ""}
                </p>
              </Link>
            ))}
            {!todayTasks.length ? (
              <p className="px-5 py-8 text-sm text-[var(--ink-soft)]">Nothing due today.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
