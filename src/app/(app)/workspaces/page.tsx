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
        title="CRM desks"
        description="Optional internal sales labels only. Not paid office seats."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "CRM desks" },
        ]}
      />

      <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-medium">Wrong place?</p>
        <p className="mt-1">
          Looking for <strong>paid office / developer desks charged per seat</strong>? That is{" "}
          <Link href="/seat-workspaces" className="font-medium underline">
            Property → Seat workspaces
          </Link>
          . Looking for <strong>staff logins and lead assignment</strong>? That is{" "}
          <Link href="/users" className="font-medium underline">
            Admin → Users
          </Link>
          .
        </p>
        <p className="mt-3 font-medium">This page is only optional CRM sales desks</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Internal labels to group leads (e.g. “Partnerships desk”).</li>
          <li>Not a building, not a seat product, not required for most companies.</li>
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
