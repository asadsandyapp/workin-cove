import { createLead } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default async function NewLeadPage() {
  const [workspaces, tags, customFields] = await Promise.all([
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.customFieldDefinition.findMany({
      where: { entityType: "lead" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New lead" description="Manual lead entry." />
      <form action={createLead} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" name="companyName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Select id="source" name="source" defaultValue="MANUAL">
              <option value="MANUAL">MANUAL</option>
              <option value="IMPORT">IMPORT</option>
              <option value="META">META</option>
              <option value="GOOGLE_ADS">GOOGLE_ADS</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign">Campaign</Label>
            <Input id="campaign" name="campaign" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue="NEW">
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="DISQUALIFIED">DISQUALIFIED</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspaceId">Workspace</Label>
            <Select id="workspaceId" name="workspaceId" defaultValue="">
              <option value="">None</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="tagIds" value={tag.id} />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
        {customFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={`cf_${field.key}`}>{field.label}</Label>
            <Input id={`cf_${field.key}`} name={`cf_${field.key}`} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>
        <Button type="submit">Create lead</Button>
      </form>
    </div>
  );
}
