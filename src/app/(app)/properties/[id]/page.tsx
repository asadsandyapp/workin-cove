import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploader } from "@/components/document-uploader";
import { formatMinor } from "@/lib/money";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      leases: { include: { tenant: { include: { contact: true } } } },
      expenses: { take: 10, orderBy: { incurredOn: "desc" } },
      workOrders: { take: 10, orderBy: { createdAt: "desc" } },
      documents: true,
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={property.name} description={property.addressLine1} />
      <div className="flex gap-2">
        <Badge>{property.status}</Badge>
        <Badge variant="outline">{property.propertyType}</Badge>
        <Badge variant="secondary">
          Acq {formatMinor(property.acquisitionCostMinor)}
        </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {property.leases.map((l) => (
              <Link key={l.id} href={`/leases/${l.id}`} className="block hover:underline">
                {l.tenant.contact.firstName} · {l.status} ·{" "}
                {formatMinor(l.rentAmountMinor)}
              </Link>
            ))}
            {!property.leases.length ? (
              <p className="text-stone-500">No leases.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses & maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {property.expenses.map((e) => (
              <div key={e.id}>
                {e.title} · {formatMinor(e.amountMinor)}
              </div>
            ))}
            {property.workOrders.map((w) => (
              <div key={w.id}>
                WO: {w.title} · {w.status}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DocumentUploader entityType="property" entityId={property.id} />
          {property.documents.map((d) => (
            <a key={d.id} href={`/api/documents/${d.id}`} className="block text-sm text-teal-800">
              {d.originalName}
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
