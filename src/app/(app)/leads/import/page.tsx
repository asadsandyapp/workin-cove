import { LeadImportClient } from "./import-client";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";

export default async function LeadImportPage() {
  const [workspaces, jobs] = await Promise.all([
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div>
      <PageHeader
        title="Import leads"
        description="CSV or Excel with preview, mapping, validation, and duplicate detection."
      />
      <LeadImportClient
        workspaces={workspaces.map((w) => ({ id: w.id, name: w.name }))}
        recentJobs={jobs.map((j) => ({
          id: j.id,
          filename: j.filename,
          status: j.status,
          totalRows: j.totalRows,
          successCount: j.successCount,
          errorCount: j.errorCount,
          duplicateCount: j.duplicateCount,
          createdAt: j.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
