import { prisma } from "@/lib/db";

type ActivityInput = {
  type: string;
  summary: string;
  body?: string;
  leadId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  taskId?: string | null;
  workspaceId?: string | null;
  createdById?: string | null;
};

export async function logActivity(input: ActivityInput) {
  return prisma.activity.create({
    data: {
      type: input.type,
      summary: input.summary,
      body: input.body,
      leadId: input.leadId ?? undefined,
      contactId: input.contactId ?? undefined,
      companyId: input.companyId ?? undefined,
      dealId: input.dealId ?? undefined,
      taskId: input.taskId ?? undefined,
      workspaceId: input.workspaceId ?? undefined,
      createdById: input.createdById ?? undefined,
    },
  });
}
