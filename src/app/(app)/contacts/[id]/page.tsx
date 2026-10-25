import { notFound } from "next/navigation";
import Link from "next/link";
import { addNote } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentUploader } from "@/components/document-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fullName } from "@/lib/utils";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      workspace: true,
      deals: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      documents: { orderBy: { createdAt: "desc" } },
      convertedFromLead: true,
    },
  });
  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName(contact.firstName, contact.lastName)}
        description={contact.title || "Contact"}
      />
      <div className="flex gap-2">
        {contact.isCustomer ? <Badge variant="success">Customer</Badge> : null}
        {contact.company ? (
          <Link href={`/companies/${contact.company.id}`}>
            <Badge variant="outline">{contact.company.name}</Badge>
          </Link>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Email: {contact.email || "—"}</p>
            <p>Phone: {contact.phone || "—"}</p>
            <p>Team: {contact.workspace?.name || "—"}</p>
            {contact.convertedFromLead ? (
              <p>
                Converted from{" "}
                <Link
                  className="text-teal-800 underline"
                  href={`/leads/${contact.convertedFromLead.id}`}
                >
                  lead
                </Link>
              </p>
            ) : null}
            <p className="text-stone-600">{contact.notes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contact.deals.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block text-sm hover:underline">
                {d.title}
              </Link>
            ))}
            {!contact.deals.length ? (
              <p className="text-sm text-stone-500">No deals.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes & documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="contactId" value={contact.id} />
              <Textarea name="body" required rows={3} />
              <Button type="submit" variant="secondary">
                Add note
              </Button>
            </form>
            <DocumentUploader entityType="contact" entityId={contact.id} />
            {contact.documents.map((d) => (
              <a key={d.id} href={`/api/documents/${d.id}`} className="block text-sm text-teal-800">
                {d.originalName}
              </a>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={contact.activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
