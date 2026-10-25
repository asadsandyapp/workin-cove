import { createDeal } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function NewDealPage() {
  const [pipeline, contacts, companies, workspaces, leads] = await Promise.all([
    prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.contact.findMany({ orderBy: { firstName: "asc" } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: { status: { not: "CONVERTED" } },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New deal" />
      <form action={createDeal} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input name="title" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Value</Label>
            <Input name="value" type="number" defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected close</Label>
            <Input name="expectedCloseDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select name="stageId" required defaultValue={pipeline?.stages[0]?.id || ""}>
              {(pipeline?.stages || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Next action</Label>
            <Input name="nextAction" />
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select name="contactId" defaultValue="">
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName || ""}
                </option>
              ))}
            </Select>
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
            <Label>Lead</Label>
            <Select name="leadId" defaultValue="">
              <option value="">None</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName || ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Team (optional)</Label>
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
        <Button type="submit">Create deal</Button>
      </form>
    </div>
  );
}
