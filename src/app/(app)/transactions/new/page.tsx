import { createPropertyTransaction } from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewTransactionPage() {
  const [properties, contacts] = await Promise.all([
    prisma.property.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { firstName: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New property transaction" />
      <form action={createPropertyTransaction} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="type" defaultValue="SALE">
              <option value="SALE">SALE</option>
              <option value="PURCHASE">PURCHASE</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select name="status" defaultValue="DRAFT">
              {["DRAFT", "UNDER_CONTRACT", "COMPLETED", "CANCELLED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
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
          <Label>Counterparty (CRM contact)</Label>
          <Select name="counterpartyContactId" defaultValue="">
            <option value="">None</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input name="agreedAmount" type="number" step="0.01" placeholder="Agreed amount" required />
          <Input name="fees" type="number" step="0.01" placeholder="Fees" />
          <Input name="taxes" type="number" step="0.01" placeholder="Taxes" />
        </div>
        <Input name="closingDate" type="date" />
        <Textarea name="notes" rows={3} />
        <p className="text-xs text-stone-500">
          Ledger postings and property status updates run only when status is COMPLETED.
        </p>
        <Button type="submit">Save transaction</Button>
      </form>
    </div>
  );
}
