import Link from "next/link";
import { prisma } from "@/lib/db";
import { countTasksByViews, taskWhereForView } from "@/lib/tasks";
import { trialBalance } from "@/lib/accounting";
import { formatMinor } from "@/lib/money";
import { formatMoney, fullName } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { NAV_GROUPS } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";

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
      className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">{detail}</p>
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
  ]);

  const tz = settings?.businessTimezone ?? "Asia/Karachi";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="What should I do today?"
        description={`This home screen lists work that needs action. Use the left menu groups (CRM, Property, Operations, Finance) — click a group name for a plain-English overview. Timezone: ${tz}.`}
      />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Action queue</h2>
          <p className="text-xs text-slate-500">
            Highest priority items first. Click a row to open the right screen.
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
          <ActionRow
            title={`Books are ${tb.balanced ? "balanced" : "out of balance"}`}
            detail={`Debits ${formatMinor(tb.totalDebit)} · Credits ${formatMinor(tb.totalCredit)}`}
            href="/accounting"
            urgency={tb.balanced ? "done" : "high"}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Open pipeline
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMoney(dealValue._sum.value ?? 0)}
          </p>
          <p className="mt-1 text-sm text-slate-600">{openDeals} open deals</p>
          <Link href="/deals" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Open deals →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Task load
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{taskCounts.open}</p>
          <p className="mt-1 text-sm text-slate-600">
            {taskCounts.unscheduled} unscheduled · {taskCounts.next7} in next 7 days
          </p>
          <Link href="/tasks?view=open" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Open tasks →
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Need help finding a screen?
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Click a group title on the left (CRM, Property, Operations, Finance, Admin) for a short guide.
          </p>
          <Link href="/crm" className="mt-3 inline-block text-sm text-teal-800 hover:underline">
            Open CRM guide →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Browse by module</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_GROUPS.map((group) => (
            <Link
              key={group.id}
              href={group.href}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm"
            >
              <p className="font-medium text-slate-900">{group.label}</p>
              <p className="mt-1 text-sm text-slate-600">{group.blurb}</p>
              <p className="mt-3 text-xs text-slate-500">
                {group.items.map((i) => i.label).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">New leads to review</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">
                  {fullName(lead.firstName, lead.lastName)}
                </span>
                <span className="text-xs text-slate-500">{lead.source}</span>
              </Link>
            ))}
            {!recentLeads.length ? (
              <p className="px-4 py-6 text-sm text-slate-500">No new leads.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">Today&apos;s tasks</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {todayTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks?view=today"
                className="block px-4 py-3 text-sm hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">
                  {task.type}
                  {task.dueAt ? ` · ${task.dueAt.toLocaleString()}` : ""}
                </p>
              </Link>
            ))}
            {!todayTasks.length ? (
              <p className="px-4 py-6 text-sm text-slate-500">Nothing due today.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
