import { notFound } from "next/navigation";
import { addNote } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentUploader } from "@/components/document-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/utils";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      stage: true,
      pipeline: { include: { stages: { orderBy: { sortOrder: "asc" } } } },
      contact: true,
      company: true,
      workspace: true,
      stageHistory: {
        include: { fromStage: true, toStage: true, changedBy: true },
        orderBy: { createdAt: "desc" },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      documents: true,
    },
  });
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={deal.title} description={deal.pipeline.name} />
      <div className="flex flex-wrap gap-2">
        <Badge>{deal.status}</Badge>
        <Badge variant="secondary">{deal.stage.name}</Badge>
        <Badge variant="outline">{formatMoney(deal.value, deal.currency)}</Badge>
        {deal.lossReason ? <Badge variant="danger">Lost: {deal.lossReason}</Badge> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Next action: {deal.nextAction || "—"}</p>
            <p>
              Expected close:{" "}
              {deal.expectedCloseDate
                ? deal.expectedCloseDate.toLocaleDateString()
                : "—"}
            </p>
            <p>Contact: {deal.contact ? `${deal.contact.firstName}` : "—"}</p>
            <p>Company: {deal.company?.name || "—"}</p>
            <p>Team: {deal.workspace?.name || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stage history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {deal.stageHistory.map((h) => (
              <div key={h.id} className="border-b pb-2">
                <p>
                  {h.fromStage?.name || "—"} → {h.toStage.name}
                </p>
                <p className="text-xs text-stone-500">
                  {h.createdAt.toLocaleString()}
                  {h.note ? ` · ${h.note}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes & documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="dealId" value={deal.id} />
              <Textarea name="body" required rows={3} />
              <Button type="submit" variant="secondary">
                Add note
              </Button>
            </form>
            <DocumentUploader entityType="deal" entityId={deal.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline items={deal.activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
