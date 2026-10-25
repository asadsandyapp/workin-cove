import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { fullName } from "@/lib/utils";

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    include: {
      contact: true,
      _count: { select: { leases: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader
        title="Tenants"
        description="People renting your properties. Prefer New lease to add a renter in one step — this list is for looking them up later."
        actionHref="/leases/new"
        actionLabel="New lease"
      />
      <p className="mb-4 text-sm text-slate-500">
        Need a tenant record without a lease yet?{" "}
        <Link href="/tenants/new" className="text-teal-800 underline">
          Add tenant only
        </Link>
        .
      </p>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Leases</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/tenants/${t.id}`} className="text-teal-900 hover:underline">
                    {fullName(t.contact.firstName, t.contact.lastName)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/contacts/${t.contactId}`} className="hover:underline">
                    CRM contact
                  </Link>
                </td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">{t._count.leases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
