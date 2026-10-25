import { createContact } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewContactPage() {
  const [companies, workspaces] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New contact" />
      <form action={createContact} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input name="firstName" required />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input name="lastName" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input name="phone" />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Select name="companyId" defaultValue="">
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Workspace</Label>
            <Select name="workspaceId" defaultValue="">
              <option value="">None</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCustomer" /> Customer
        </label>
        <Textarea name="notes" placeholder="Notes" rows={3} />
        <Button type="submit">Create contact</Button>
      </form>
    </div>
  );
}
