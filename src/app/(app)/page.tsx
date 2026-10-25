import Link from "next/link";
import { prisma } from "@/lib/db";
import { countTasksByViews } from "@/lib/tasks";
import { formatMoney, fullName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      take: 8,
      include: {
        lead: true,
        contact: true,
        deal: true,
      },
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
  ]);

  const conversionRate =
    totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100);
  const closed = wonDeals + lostDeals;
  const winRate = closed === 0 ? 0 : Math.round((wonDeals / closed) * 100);

  const cards = [
    {
      label: "New leads",
      value: String(newLeads),
      href: "/leads?status=NEW",
      hint: "Ready to qualify",
    },
    {
      label: "Open deals",
      value: String(openDeals),
      href: "/deals?status=OPEN",
      hint: formatMoney(dealValue._sum.value ?? 0),
    },
    {
      label: "Overdue tasks",
      value: String(taskCounts.overdue),
      href: "/tasks?view=overdue",
      hint: "Needs attention",
    },
    {
      label: "Today's follow-ups",
      value: String(taskCounts.today),
      href: "/tasks?view=today",
      hint: `TZ ${settings?.businessTimezone ?? "Asia/Karachi"}`,
    },
    {
      label: "Lead conversion",
      value: `${conversionRate}%`,
      href: "/leads?status=CONVERTED",
      hint: `${convertedLeads} converted`,
    },
    {
      label: "Win rate",
      value: `${winRate}%`,
      href: "/deals",
      hint: `${wonDeals} won / ${lostDeals} lost`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-teal-950">
          CRM dashboard
        </h1>
        <p className="mt-1 text-stone-600">
          Live counts from your Workin Cove workspace CRM.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => (
          <Link
            key={card.label}
            href={card.href}
            className="animate-fade-up-delay block transition hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Card className="h-full border-stone-200/80 bg-white/90">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-stone-500">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold text-teal-950">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{card.hint}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadsBySource.map((row) => (
              <Link
                key={row.source}
                href={`/leads?source=${encodeURIComponent(row.source)}`}
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-stone-50"
              >
                <span className="text-sm text-stone-700">{row.source}</span>
                <Badge variant="secondary">{row._count._all}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline stage mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stages.map((stage) => (
              <Link
                key={stage.id}
                href={`/deals?stageId=${stage.id}`}
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-stone-50"
              >
                <span className="flex items-center gap-2 text-sm text-stone-700">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.name}
                </span>
                <Badge variant="secondary">{stage._count.deals}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace summaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workspaceSummaries.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="block rounded-md border border-stone-100 px-3 py-3 hover:bg-stone-50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-stone-900">{ws.name}</p>
                  <Badge variant="outline">{ws.code || "—"}</Badge>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {ws._count.leads} leads · {ws._count.contacts} contacts ·{" "}
                  {ws._count.deals} deals · {ws._count.tasks} tasks
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently updated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="border-b border-stone-100 pb-3 last:border-0">
                <p className="text-sm text-stone-800">{activity.summary}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {activity.type}
                  {activity.lead
                    ? ` · ${fullName(activity.lead.firstName, activity.lead.lastName)}`
                    : ""}
                  {activity.contact
                    ? ` · ${fullName(activity.contact.firstName, activity.contact.lastName)}`
                    : ""}
                  {activity.deal ? ` · ${activity.deal.title}` : ""}
                  {" · "}
                  {activity.createdAt.toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
