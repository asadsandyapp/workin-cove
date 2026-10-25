import { createLease } from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function NewLeasePage() {
  const [properties, tenants] = await Promise.all([
    prisma.property.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.tenant.findMany({ include: { contact: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New lease" />
      <form action={createLease} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label>Property</Label>
          <Select name="propertyId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tenant</Label>
          <Select name="tenantId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.contact.firstName} {t.contact.lastName || ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input name="startDate" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input name="endDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly rent</Label>
            <Input name="rentAmount" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label>Due day</Label>
            <Input name="dueDayOfMonth" type="number" defaultValue={1} />
          </div>
          <div className="space-y-1.5">
            <Label>Security deposit</Label>
            <Input name="securityDeposit" type="number" step="0.01" defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Annual escalation %</Label>
            <Input name="escalationPercent" type="number" step="0.01" defaultValue={5} />
          </div>
        </div>
        <Select name="status" defaultValue="ACTIVE">
          {["DRAFT", "ACTIVE", "ENDED", "TERMINATED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button type="submit">Create lease</Button>
      </form>
    </div>
  );
}
