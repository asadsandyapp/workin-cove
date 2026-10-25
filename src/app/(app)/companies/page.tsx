import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const companies = await prisma.company.findMany({
    where: params.q
      ? {
          OR: [
            { name: { contains: params.q } },
            { email: { contains: params.q } },
            { industry: { contains: params.q } },
          ],
        }
      : undefined,
    include: {
      workspace: true,
      _count: { select: { contacts: true, deals: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Business accounts linked to contacts and deals."
        actionHref="/companies/new"
        actionLabel="New company"
      />
      <form className="mb-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search companies…"
          className="h-9 rounded-md border px-3 text-sm"
        />
      </form>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Workspace</th>
              <th className="px-4 py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/companies/${c.id}`} className="font-medium text-teal-900 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.industry || "—"}</td>
                <td className="px-4 py-3">{c.workspace?.name || "—"}</td>
                <td className="px-4 py-3">
                  {c._count.contacts} contacts · {c._count.deals} deals
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
