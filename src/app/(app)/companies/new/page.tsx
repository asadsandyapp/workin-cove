import { createCompany } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewCompanyPage() {
  const workspaces = await prisma.workspace.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New company" />
      <form action={createCompany} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input name="website" />
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Input name="industry" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input name="email" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input name="phone" />
          </div>
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
        <Textarea name="notes" rows={3} placeholder="Notes" />
        <Button type="submit">Create company</Button>
      </form>
    </div>
  );
}
