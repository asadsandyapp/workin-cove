import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fullName } from "@/lib/utils";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      leads: { take: 8, orderBy: { updatedAt: "desc" } },
      deals: { take: 8, orderBy: { updatedAt: "desc" } },
      tasks: { take: 8, orderBy: { dueAt: "asc" }, where: { status: "OPEN" } },
      contacts: { take: 8, orderBy: { updatedAt: "desc" } },
    },
  });
  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={workspace.name}
        description={workspace.description || "Operational workspace"}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.leads.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} className="block text-sm hover:underline">
                {fullName(l.firstName, l.lastName)} · {l.status}
              </Link>
            ))}
            {!workspace.leads.length ? (
              <p className="text-sm text-stone-500">No leads in this workspace.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.tasks.map((t) => (
              <Link key={t.id} href="/tasks" className="block text-sm hover:underline">
                {t.title}
              </Link>
            ))}
            {!workspace.tasks.length ? (
              <p className="text-sm text-stone-500">No open tasks.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.deals.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block text-sm hover:underline">
                {d.title}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspace.contacts.map((c) => (
              <Link key={c.id} href={`/contacts/${c.id}`} className="block text-sm hover:underline">
                {fullName(c.firstName, c.lastName)}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
