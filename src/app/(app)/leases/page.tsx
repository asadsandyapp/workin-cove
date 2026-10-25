import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";
import { fullName } from "@/lib/utils";

export default async function LeasesPage() {
  const leases = await prisma.lease.findMany({
    where: { archivedAt: null },
    include: {
      property: true,
      tenant: { include: { contact: true } },
      invoices: { where: { status: { in: ["OPEN", "PARTIAL"] } } },
    },
    orderBy: { startDate: "desc" },
  });
  return (
    <div>
      <PageHeader
        title="Leases"
        description="Lease terms, rent schedules, escalations, and collection."
        actionHref="/leases/new"
        actionLabel="New lease"
      />
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Open invoices</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {leases.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/leases/${l.id}`} className="text-teal-900 hover:underline">
                    {l.property.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {fullName(l.tenant.contact.firstName, l.tenant.contact.lastName)}
                </td>
                <td className="px-4 py-3">{formatMinor(l.rentAmountMinor, l.currency)}</td>
                <td className="px-4 py-3">{l.invoices.length}</td>
                <td className="px-4 py-3">
                  <Badge>{l.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
