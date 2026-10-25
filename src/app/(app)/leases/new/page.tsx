import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { LeaseWizardForm } from "./lease-wizard-form";
import { fullName } from "@/lib/utils";

export default async function NewLeasePage() {
  const [properties, tenants] = await Promise.all([
    prisma.property.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.tenant.findMany({
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!properties.length) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader
          eyebrow="Property"
          title="Add a property first"
          description="A lease needs a property. Create one inventory record, then come back here."
          breadcrumbs={[
            { label: "Property", href: "/property" },
            { label: "Leases", href: "/leases" },
            { label: "New" },
          ]}
        />
        <Link
          href="/properties/new"
          className="inline-flex rounded-md bg-teal-800 px-4 py-2 text-sm font-medium text-white"
        >
          Add property
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Property"
        title="New lease"
        description="One form: pick the property, enter the tenant person, set rent. No need to create Contact → Tenant separately."
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Leases", href: "/leases" },
          { label: "New" },
        ]}
      />
      <LeaseWizardForm
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        tenants={tenants.map((t) => ({
          id: t.id,
          label: fullName(t.contact.firstName, t.contact.lastName),
        }))}
      />
    </div>
  );
}
