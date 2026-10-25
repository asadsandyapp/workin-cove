import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { DealKanban } from "./deal-kanban";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    stageId?: string;
    view?: string;
    pipelineId?: string;
  }>;
}) {
  const params = await searchParams;
  const pipelines = await prisma.pipeline.findMany({
    include: { stages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  const pipeline =
    pipelines.find((p) => p.id === params.pipelineId) ||
    pipelines.find((p) => p.isDefault) ||
    pipelines[0];

  const deals = await prisma.deal.findMany({
    where: {
      ...(pipeline ? { pipelineId: pipeline.id } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.stageId ? { stageId: params.stageId } : {}),
    },
    include: {
      stage: true,
      contact: true,
      company: true,
      workspace: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const view = params.view === "table" ? "table" : "kanban";

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Deals"
        description="Sales opportunities. Drag/move stages on Kanban, or use Table. Lost deals ask for a loss reason."
        actionHref="/deals/new"
        actionLabel="New deal"
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Deals" },
        ]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {pipelines.map((p) => (
          <Link
            key={p.id}
            href={`/deals?pipelineId=${p.id}&view=${view}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              pipeline?.id === p.id ? "bg-teal-900 text-white" : "border bg-white"
            }`}
          >
            {p.name}
          </Link>
        ))}
        <Link
          href={`/deals?pipelineId=${pipeline?.id || ""}&view=kanban`}
          className={`rounded-md px-3 py-1.5 text-sm ${view === "kanban" ? "bg-stone-800 text-white" : "border"}`}
        >
          Kanban
        </Link>
        <Link
          href={`/deals?pipelineId=${pipeline?.id || ""}&view=table`}
          className={`rounded-md px-3 py-1.5 text-sm ${view === "table" ? "bg-stone-800 text-white" : "border"}`}
        >
          Table
        </Link>
      </div>

      {view === "kanban" && pipeline ? (
        <DealKanban
          stages={pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            isLost: s.isLost,
          }))}
          deals={deals.map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            currency: d.currency,
            stageId: d.stageId,
            nextAction: d.nextAction,
            companyName: d.company?.name || null,
          }))}
        />
      ) : (
        <div className="data-table-wrap">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3">Deal</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Next action</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-t hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${d.id}`} className="font-medium text-teal-900 hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{d.stage.name}</td>
                  <td className="px-4 py-3">{formatMoney(d.value, d.currency)}</td>
                  <td className="px-4 py-3">{d.nextAction || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge>{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
