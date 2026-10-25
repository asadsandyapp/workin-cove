import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { fullName } from "@/lib/utils";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; customer?: string }>;
}) {
  const params = await searchParams;
  const contacts = await prisma.contact.findMany({
    where: {
      ...(params.customer === "1" ? { isCustomer: true } : {}),
      ...(params.q
        ? {
            OR: [
              { firstName: { contains: params.q } },
              { lastName: { contains: params.q } },
              { email: { contains: params.q } },
              { phone: { contains: params.q } },
            ],
          }
        : {}),
    },
    include: { company: true, workspace: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="People linked to companies, deals, and specialized modules."
        actionHref="/contacts/new"
        actionLabel="New contact"
      />
      <form className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search contacts…"
          className="h-9 rounded-md border px-3 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="customer" value="1" defaultChecked={params.customer === "1"} />
          Customers only
        </label>
        <button className="h-9 rounded-md bg-teal-900 px-3 text-sm text-white" type="submit">
          Filter
        </button>
      </form>
      <div className="data-table-wrap">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-teal-900 hover:underline">
                    {fullName(c.firstName, c.lastName)}
                  </Link>
                  <div className="text-xs text-stone-500">{c.email || c.phone}</div>
                </td>
                <td className="px-4 py-3">
                  {c.company ? (
                    <Link href={`/companies/${c.company.id}`} className="hover:underline">
                      {c.company.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{c.workspace?.name || "—"}</td>
                <td className="px-4 py-3">
                  {c.isCustomer ? <Badge variant="success">Customer</Badge> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
