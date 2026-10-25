import { createTenant } from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewTenantPage() {
  const contacts = await prisma.contact.findMany({
    where: { tenant: null },
    orderBy: { firstName: "asc" },
  });
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Add tenant" description="Choose an existing CRM contact." />
      <form action={createTenant} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label>CRM contact</Label>
          <Select name="contactId" required defaultValue="">
            <option value="" disabled>
              Select contact
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""} ({c.email || c.phone || "no contact info"})
              </option>
            ))}
          </Select>
        </div>
        <Textarea name="notes" rows={3} placeholder="Notes" />
        <Button type="submit">Create tenant</Button>
      </form>
    </div>
  );
}
