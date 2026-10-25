import Link from "next/link";
import { notFound } from "next/navigation";
import {
  convertLeadAction,
  updateLead,
  addNote,
} from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentUploader } from "@/components/document-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fullName } from "@/lib/utils";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lead, workspaces, tags, documents] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        workspace: true,
        tags: { include: { tag: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
        notesList: { orderBy: { createdAt: "desc" } },
        convertedContact: true,
        deals: true,
      },
    }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.document.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!lead) notFound();
  const selectedTags = new Set(lead.tags.map((t) => t.tagId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName(lead.firstName, lead.lastName)}
        description={`${lead.source} · ${lead.status}`}
      />
      <div className="flex flex-wrap gap-2">
        <Badge>{lead.status}</Badge>
        {lead.tags.map((t) => (
          <Badge key={t.tagId} variant="outline" style={{ borderColor: t.tag.color }}>
            {t.tag.name}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lead details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateLead} className="space-y-3">
              <input type="hidden" name="id" value={lead.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input name="firstName" defaultValue={lead.firstName} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input name="lastName" defaultValue={lead.lastName || ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input name="email" defaultValue={lead.email || ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={lead.phone || ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>Company</Label>
                  <Input name="companyName" defaultValue={lead.companyName || ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={lead.status}>
                    {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "DISQUALIFIED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select name="source" defaultValue={lead.source}>
                    {["MANUAL", "IMPORT", "META", "GOOGLE_ADS"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Campaign</Label>
                  <Input name="campaign" defaultValue={lead.campaign || ""} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Workspace</Label>
                  <Select name="workspaceId" defaultValue={lead.workspaceId || ""}>
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
                      <input
                        type="checkbox"
                        name="tagIds"
                        value={tag.id}
                        defaultChecked={selectedTags.has(tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={lead.notes || ""} rows={3} />
              </div>
              <Button type="submit">Save lead</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {lead.status !== "CONVERTED" ? (
            <Card>
              <CardHeader>
                <CardTitle>Qualify / convert</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={convertLeadAction} className="space-y-3">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="makeCustomer" defaultChecked />
                    Mark as customer
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="createDeal" defaultChecked />
                    Create deal in default pipeline
                  </label>
                  <Input name="dealTitle" placeholder="Deal title (optional)" />
                  <Input name="dealValue" type="number" placeholder="Deal value" />
                  <Button type="submit" className="w-full">
                    Convert to contact
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm">
                Converted to{" "}
                {lead.convertedContact ? (
                  <Link
                    href={`/contacts/${lead.convertedContact.id}`}
                    className="text-teal-800 underline"
                  >
                    {fullName(
                      lead.convertedContact.firstName,
                      lead.convertedContact.lastName,
                    )}
                  </Link>
                ) : (
                  "contact"
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Add note</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addNote} className="space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <Textarea name="body" required rows={3} />
                <Button type="submit" variant="secondary">
                  Save note
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DocumentUploader entityType="lead" entityId={lead.id} />
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/documents/${doc.id}`}
                  className="block text-sm text-teal-800 hover:underline"
                >
                  {doc.originalName}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={lead.activities} />
        </CardContent>
      </Card>
    </div>
  );
}
