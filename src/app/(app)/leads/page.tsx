import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { leadScopeWhere } from "@/lib/leads-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { fullName } from "@/lib/utils";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    source?: string;
    q?: string;
    workspaceId?: string;
    assigneeId?: string;
    mine?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const scope = isAdmin(user)
    ? params.mine === "1"
      ? { assigneeId: user.id }
      : params.assigneeId
        ? {
            assigneeId:
              params.assigneeId === "unassigned" ? null : params.assigneeId,
          }
        : {}
    : leadScopeWhere(user);

  const where = {
    AND: [
      scope,
      ...(params.status ? [{ status: params.status }] : []),
      ...(params.source ? [{ source: params.source }] : []),
      ...(params.workspaceId ? [{ workspaceId: params.workspaceId }] : []),
      ...(params.q
        ? [
            {
              OR: [
                { firstName: { contains: params.q } },
                { lastName: { contains: params.q } },
                { email: { contains: params.q } },
                { phone: { contains: params.q } },
                { companyName: { contains: params.q } },
              ],
            },
          ]
        : []),
    ],
  };

  const [leads, workspaces, users] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        workspace: true,
        assignee: true,
        tags: { include: { tag: true } },
      },
      take: 200,
    }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    isAdmin(user)
      ? prisma.user.findMany({
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description={
          isAdmin(user)
            ? "Assign each lead to a user. Agents only see their own leads plus the unassigned pool."
            : "Your assigned leads and the unassigned pool. Claim a lead by opening it and saving (you become owner)."
        }
        actionHref="/leads/new"
        actionLabel="New lead"
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Leads" },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/leads/import" className="rounded-md border px-3 py-1.5 text-sm hover:bg-white">
          Import CSV/Excel
        </Link>
        {isAdmin(user) ? (
          <Link
            href="/leads?mine=1"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-white"
          >
            My leads
          </Link>
        ) : null}
        <Link href="/leads" className="rounded-md border px-3 py-1.5 text-sm hover:bg-white">
          {isAdmin(user) ? "All leads" : "My + unassigned"}
        </Link>
        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search…"
            className="h-9 rounded-md border border-stone-300 px-3 text-sm"
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className="h-9 rounded-md border border-stone-300 px-2 text-sm"
          >
            <option value="">All statuses</option>
            {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "DISQUALIFIED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={params.source || ""}
            className="h-9 rounded-md border border-stone-300 px-2 text-sm"
          >
            <option value="">All sources</option>
            {["MANUAL", "IMPORT", "META", "GOOGLE_ADS"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isAdmin(user) ? (
            <select
              name="assigneeId"
              defaultValue={params.assigneeId || ""}
              className="h-9 rounded-md border border-stone-300 px-2 text-sm"
            >
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            name="workspaceId"
            defaultValue={params.workspaceId || ""}
            className="h-9 rounded-md border border-stone-300 px-2 text-sm"
          >
            <option value="">All CRM desks</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button type="submit" className="h-9 rounded-md bg-teal-900 px-3 text-sm text-white">
            Filter
          </button>
        </form>
      </div>
      <div className="data-table-wrap">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-stone-100 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-teal-900 hover:underline">
                    {fullName(lead.firstName, lead.lastName)}
                  </Link>
                  <div className="text-xs text-stone-500">
                    {lead.email || lead.phone || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge>{lead.status}</Badge>
                </td>
                <td className="px-4 py-3">{lead.assignee?.name || "Unassigned"}</td>
                <td className="px-4 py-3">{lead.source}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((t) => (
                      <Badge key={t.tagId} variant="outline">
                        {t.tag.name}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!leads.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No leads match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
