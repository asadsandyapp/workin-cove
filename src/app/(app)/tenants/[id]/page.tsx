import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinor } from "@/lib/money";
import { fullName } from "@/lib/utils";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      contact: true,
      leases: { include: { property: true } },
    },
  });
  if (!tenant) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName(tenant.contact.firstName, tenant.contact.lastName)}
        description="Tenant profile"
      />
      <Card>
        <CardHeader>
          <CardTitle>CRM contact</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <Link href={`/contacts/${tenant.contactId}`} className="text-teal-800 underline">
            Open shared contact record
          </Link>
          <p className="mt-2">{tenant.contact.email}</p>
          <p>{tenant.contact.phone}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Leases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {tenant.leases.map((l) => (
            <Link key={l.id} href={`/leases/${l.id}`} className="block hover:underline">
              {l.property.name} · {formatMinor(l.rentAmountMinor)} · {l.status}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
