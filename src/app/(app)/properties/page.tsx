import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { leases: true, expenses: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Property"
        title="Property inventory"
        description="Buildings and units the company owns. (Admin → Teams is unrelated — that is only an optional CRM desk label.)"
        actionHref="/properties/new"
        actionLabel="Add property"
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Properties" },
        ]}
      />
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acquisition</th>
              <th className="px-4 py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t hover:bg-stone-50">
                <td className="px-4 py-3">
                  <Link href={`/properties/${p.id}`} className="font-medium text-teal-900 hover:underline">
                    {p.name}
                  </Link>
                  <div className="text-xs text-stone-500">{p.addressLine1}</div>
                </td>
                <td className="px-4 py-3">{p.propertyType}</td>
                <td className="px-4 py-3">
                  <Badge>{p.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {formatMinor(p.acquisitionCostMinor)}
                </td>
                <td className="px-4 py-3">
                  {p._count.leases} leases · {p._count.expenses} expenses
                </td>
              </tr>
            ))}
            {!properties.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No properties yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
