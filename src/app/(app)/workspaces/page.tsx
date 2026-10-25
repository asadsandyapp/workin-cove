import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspaceForm } from "./workspace-form";

export default async function WorkspacesPage() {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { leads: true, contacts: true, deals: true, tasks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · optional"
        title="Teams"
        description="A simple label so you can group CRM leads and tasks by desk. Not a building, not a rental property, and not required."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Teams" },
        ]}
      />

      <section className="rounded-lg border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950">
        <p className="font-medium">Do you need this?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sky-900">
          <li>
            <strong>One office / one sales person:</strong> ignore Teams. Use Leads,
            Contacts, and Deals as usual. Leave the Team field blank on forms.
          </li>
          <li>
            <strong>Several desks:</strong> create a team per desk (e.g. “Sales”,
            “Partnerships”) so each person only sees their pile of leads and tasks.
          </li>
          <li>
            <strong>Never</strong> create a team for a building or rental unit —
            that belongs under Property → Properties.
          </li>
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Existing teams ({workspaces.length})
          </h2>
          {!workspaces.length ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No teams yet — that is fine. Most small companies never create one.
            </p>
          ) : null}
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/workspaces/${ws.id}`}>
              <Card className="mb-3 transition hover:border-teal-700/40">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium text-stone-900">{ws.name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {ws.description || "No description"}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {ws._count.leads} leads · {ws._count.contacts} contacts ·{" "}
                      {ws._count.deals} deals · {ws._count.tasks} tasks
                    </p>
                  </div>
                  <Badge variant="outline">{ws.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <WorkspaceForm />
      </div>
    </div>
  );
}
