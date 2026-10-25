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
    <div>
      <PageHeader
        title="Workspaces"
        description="Operational contexts for filtering CRM work — not properties."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
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
