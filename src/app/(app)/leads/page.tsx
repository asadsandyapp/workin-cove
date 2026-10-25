import Link from "next/link";
import { prisma } from "@/lib/db";
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
  }>;
}) {
  const params = await searchParams;
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.source ? { source: params.source } : {}),
    ...(params.workspaceId ? { workspaceId: params.workspaceId } : {}),
    ...(params.q
      ? {
          OR: [
            { firstName: { contains: params.q } },
            { lastName: { contains: params.q } },
            { email: { contains: params.q } },
            { phone: { contains: params.q } },
            { companyName: { contains: params.q } },
          ],
        }
      : {}),
  };

  const [leads, workspaces] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { workspace: true, tags: { include: { tag: true } } },
      take: 200,
    }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description="New inquiries before they become customers. Create manually, import a spreadsheet, or receive Meta/Google Ads webhooks."
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
          <select
            name="workspaceId"
            defaultValue={params.workspaceId || ""}
            className="h-9 rounded-md border border-stone-300 px-2 text-sm"
          >
            <option value="">All teams</option>
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
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Team</th>
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
                <td className="px-4 py-3">{lead.source}</td>
                <td className="px-4 py-3">{lead.workspace?.name || "—"}</td>
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
