import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function convertLeadToContact(
  leadId: string,
  opts: {
    userId: string;
    makeCustomer?: boolean;
    createDeal?: boolean;
    dealTitle?: string;
    dealValue?: number;
  },
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "CONVERTED" && lead.convertedContactId) {
    throw new Error("Lead already converted");
  }

  let companyId: string | undefined;
  if (lead.companyName) {
    const existing = await prisma.company.findFirst({
      where: { name: lead.companyName },
    });
    companyId =
      existing?.id ??
      (
        await prisma.company.create({
          data: {
            name: lead.companyName,
            email: lead.email,
            phone: lead.phone,
            workspaceId: lead.workspaceId,
          },
        })
      ).id;
  }

  const contact = await prisma.contact.create({
    data: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
      notes: lead.notes,
      customFieldsJson: lead.customFieldsJson,
      isCustomer: Boolean(opts.makeCustomer),
      companyId,
      workspaceId: lead.workspaceId,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: "CONVERTED",
      convertedContactId: contact.id,
      convertedAt: new Date(),
    },
  });

  await logActivity({
    type: "LEAD_CONVERTED",
    summary: `Lead converted to contact ${lead.firstName}`,
    leadId: lead.id,
    contactId: contact.id,
    companyId,
    workspaceId: lead.workspaceId,
    createdById: opts.userId,
  });

  let dealId: string | undefined;
  if (opts.createDeal) {
    const pipeline = await prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    });
    if (pipeline?.stages[0]) {
      const deal = await prisma.deal.create({
        data: {
          title:
            opts.dealTitle ||
            `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""} opportunity`,
          value: opts.dealValue ?? 0,
          pipelineId: pipeline.id,
          stageId: pipeline.stages[0].id,
          probability: pipeline.stages[0].probability,
          leadId: lead.id,
          contactId: contact.id,
          companyId,
          workspaceId: lead.workspaceId,
        },
      });
      await prisma.dealStageHistory.create({
        data: {
          dealId: deal.id,
          toStageId: pipeline.stages[0].id,
          changedById: opts.userId,
        },
      });
      dealId = deal.id;
      await logActivity({
        type: "DEAL_CREATED",
        summary: `Deal created from converted lead`,
        leadId: lead.id,
        contactId: contact.id,
        dealId: deal.id,
        workspaceId: lead.workspaceId,
        createdById: opts.userId,
      });
    }
  }

  return { contact, dealId };
}
