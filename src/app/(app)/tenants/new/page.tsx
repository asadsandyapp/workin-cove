import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { fullName } from "@/lib/utils";
import { TenantForm } from "./tenant-form";

export default async function NewTenantPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: 200,
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        eyebrow="Property"
        title="Add tenant"
        description="Usually you can skip this and use New lease instead — it creates the person automatically. Use this only if you need a tenant without a lease yet."
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Tenants", href: "/tenants" },
          { label: "New" },
        ]}
      />
      <TenantForm
        contacts={contacts.map((c) => ({
          id: c.id,
          label: fullName(c.firstName, c.lastName),
        }))}
      />
    </div>
  );
}
