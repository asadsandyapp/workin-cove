"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { convertLeadToContact } from "@/lib/leads";
import { assertCanAccessLead } from "@/lib/leads-access";
import { parseJson } from "@/lib/utils";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function upsertWorkspace(formData: FormData) {
  const user = await requireAdmin();
  const id = opt(formData, "id");
  const data = {
    name: str(formData, "name"),
    code: opt(formData, "code"),
    description: opt(formData, "description"),
    status: str(formData, "status") || "ACTIVE",
  };
  if (!data.name) throw new Error("Name required");

  if (id) {
    await prisma.workspace.update({ where: { id }, data });
  } else {
    await prisma.workspace.create({ data });
  }
  await logActivity({
    type: "WORKSPACE_UPSERT",
    summary: `Workspace saved: ${data.name}`,
    createdById: user.id,
  });
  revalidatePath("/workspaces");
  redirect("/workspaces");
}

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const requestedAssignee = opt(formData, "assigneeId");
  const assigneeId = isAdmin(user)
    ? requestedAssignee || user.id
    : user.id;
  const lead = await prisma.lead.create({
    data: {
      firstName: str(formData, "firstName"),
      lastName: opt(formData, "lastName"),
      email: opt(formData, "email"),
      phone: opt(formData, "phone"),
      companyName: opt(formData, "companyName"),
      title: opt(formData, "title"),
      status: str(formData, "status") || "NEW",
      source: str(formData, "source") || "MANUAL",
      campaign: opt(formData, "campaign"),
      notes: opt(formData, "notes"),
      workspaceId: opt(formData, "workspaceId"),
      assigneeId,
      customFieldsJson: opt(formData, "customFieldsJson") || "{}",
    },
  });
  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);
  if (tagIds.length) {
    await prisma.leadTag.createMany({
      data: tagIds.map((tagId) => ({ leadId: lead.id, tagId })),
    });
  }
  await logActivity({
    type: "LEAD_CREATED",
    summary: `Lead created: ${lead.firstName}`,
    leadId: lead.id,
    workspaceId: lead.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, "id");
  const existing = await assertCanAccessLead(user, id);
  if (!existing) throw new Error("Lead not found or not assigned to you");

  const assigneeId = isAdmin(user)
    ? opt(formData, "assigneeId")
    : existing.assigneeId === null
      ? user.id
      : existing.assigneeId;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      firstName: str(formData, "firstName"),
      lastName: opt(formData, "lastName"),
      email: opt(formData, "email"),
      phone: opt(formData, "phone"),
      companyName: opt(formData, "companyName"),
      title: opt(formData, "title"),
      status: str(formData, "status") || "NEW",
      source: str(formData, "source") || "MANUAL",
      campaign: opt(formData, "campaign"),
      notes: opt(formData, "notes"),
      workspaceId: opt(formData, "workspaceId"),
      assigneeId,
      customFieldsJson: opt(formData, "customFieldsJson") || "{}",
    },
  });
  await prisma.leadTag.deleteMany({ where: { leadId: id } });
  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);
  if (tagIds.length) {
    await prisma.leadTag.createMany({
      data: tagIds.map((tagId) => ({ leadId: id, tagId })),
    });
  }
  await logActivity({
    type: "LEAD_UPDATED",
    summary: `Lead updated: ${lead.firstName}`,
    leadId: lead.id,
    workspaceId: lead.workspaceId,
    createdById: user.id,
  });
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function convertLeadAction(formData: FormData) {
  const user = await requireUser();
  const leadId = str(formData, "leadId");
  const existing = await assertCanAccessLead(user, leadId);
  if (!existing) throw new Error("Lead not found or not assigned to you");
  const result = await convertLeadToContact(leadId, {
    userId: user.id,
    makeCustomer: formData.get("makeCustomer") === "on",
    createDeal: formData.get("createDeal") === "on",
    dealTitle: opt(formData, "dealTitle") || undefined,
    dealValue: Number(str(formData, "dealValue") || 0),
  });
  revalidatePath("/leads");
  revalidatePath("/contacts");
  redirect(`/contacts/${result.contact.id}`);
}

export async function createContact(formData: FormData) {
  const user = await requireAdmin();
  const contact = await prisma.contact.create({
    data: {
      firstName: str(formData, "firstName"),
      lastName: opt(formData, "lastName"),
      email: opt(formData, "email"),
      phone: opt(formData, "phone"),
      title: opt(formData, "title"),
      notes: opt(formData, "notes"),
      isCustomer: formData.get("isCustomer") === "on",
      companyId: opt(formData, "companyId"),
      workspaceId: opt(formData, "workspaceId"),
      customFieldsJson: opt(formData, "customFieldsJson") || "{}",
    },
  });
  await logActivity({
    type: "CONTACT_CREATED",
    summary: `Contact created: ${contact.firstName}`,
    contactId: contact.id,
    companyId: contact.companyId,
    workspaceId: contact.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function createCompany(formData: FormData) {
  const user = await requireAdmin();
  const company = await prisma.company.create({
    data: {
      name: str(formData, "name"),
      website: opt(formData, "website"),
      email: opt(formData, "email"),
      phone: opt(formData, "phone"),
      industry: opt(formData, "industry"),
      address: opt(formData, "address"),
      notes: opt(formData, "notes"),
      workspaceId: opt(formData, "workspaceId"),
      customFieldsJson: opt(formData, "customFieldsJson") || "{}",
    },
  });
  await logActivity({
    type: "COMPANY_CREATED",
    summary: `Company created: ${company.name}`,
    companyId: company.id,
    workspaceId: company.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function createDeal(formData: FormData) {
  const user = await requireAdmin();
  const stageId = str(formData, "stageId");
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) throw new Error("Stage required");

  const deal = await prisma.deal.create({
    data: {
      title: str(formData, "title"),
      value: Number(str(formData, "value") || 0),
      expectedCloseDate: opt(formData, "expectedCloseDate")
        ? new Date(str(formData, "expectedCloseDate"))
        : null,
      nextAction: opt(formData, "nextAction"),
      pipelineId: stage.pipelineId,
      stageId,
      probability: stage.probability,
      leadId: opt(formData, "leadId"),
      contactId: opt(formData, "contactId"),
      companyId: opt(formData, "companyId"),
      workspaceId: opt(formData, "workspaceId"),
      customFieldsJson: opt(formData, "customFieldsJson") || "{}",
      status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
      lossReason: stage.isLost ? opt(formData, "lossReason") : null,
    },
  });
  await prisma.dealStageHistory.create({
    data: {
      dealId: deal.id,
      toStageId: stageId,
      changedById: user.id,
    },
  });
  await logActivity({
    type: "DEAL_CREATED",
    summary: `Deal created: ${deal.title}`,
    dealId: deal.id,
    leadId: deal.leadId,
    contactId: deal.contactId,
    companyId: deal.companyId,
    workspaceId: deal.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/deals");
  redirect(`/deals/${deal.id}`);
}

export async function moveDealStage(formData: FormData) {
  const user = await requireAdmin();
  const dealId = str(formData, "dealId");
  const stageId = str(formData, "stageId");
  const lossReason = opt(formData, "lossReason");
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!deal || !stage) throw new Error("Invalid deal/stage");

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stageId,
      probability: stage.probability,
      status: stage.isWon ? "WON" : stage.isLost ? "LOST" : "OPEN",
      lossReason: stage.isLost ? lossReason : null,
    },
  });
  await prisma.dealStageHistory.create({
    data: {
      dealId,
      fromStageId: deal.stageId,
      toStageId: stageId,
      changedById: user.id,
      note: lossReason,
    },
  });
  await logActivity({
    type: "DEAL_STAGE",
    summary: `Deal moved to ${stage.name}`,
    dealId,
    createdById: user.id,
  });
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
}

export async function createTask(formData: FormData) {
  const user = await requireAdmin();
  const dueRaw = opt(formData, "dueAt");
  const task = await prisma.task.create({
    data: {
      title: str(formData, "title"),
      description: opt(formData, "description"),
      type: str(formData, "type") || "FOLLOW_UP",
      priority: str(formData, "priority") || "MEDIUM",
      dueAt: dueRaw ? new Date(dueRaw) : null,
      leadId: opt(formData, "leadId"),
      contactId: opt(formData, "contactId"),
      companyId: opt(formData, "companyId"),
      dealId: opt(formData, "dealId"),
      workspaceId: opt(formData, "workspaceId"),
      assigneeId: user.id,
      automationKey: opt(formData, "automationKey"),
    },
  });
  await logActivity({
    type: "TASK_CREATED",
    summary: `Task created: ${task.title}`,
    taskId: task.id,
    leadId: task.leadId,
    contactId: task.contactId,
    companyId: task.companyId,
    dealId: task.dealId,
    workspaceId: task.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function completeTask(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const outcome = opt(formData, "outcome");
  const task = await prisma.task.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      outcome,
    },
  });
  await logActivity({
    type: "TASK_COMPLETED",
    summary: `Completed: ${task.title}`,
    taskId: task.id,
    leadId: task.leadId,
    contactId: task.contactId,
    companyId: task.companyId,
    dealId: task.dealId,
    workspaceId: task.workspaceId,
    createdById: user.id,
  });
  revalidatePath("/tasks");
}

export async function rescheduleTask(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const newDueRaw = opt(formData, "dueAt");
  const reason = opt(formData, "reason");
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");
  const newDue = newDueRaw ? new Date(newDueRaw) : null;
  await prisma.taskReschedule.create({
    data: {
      taskId: id,
      previousDue: task.dueAt,
      newDue,
      reason,
      changedById: user.id,
    },
  });
  await prisma.task.update({
    where: { id },
    data: { dueAt: newDue, status: "OPEN" },
  });
  await logActivity({
    type: "TASK_RESCHEDULED",
    summary: `Rescheduled: ${task.title}`,
    taskId: id,
    createdById: user.id,
  });
  revalidatePath("/tasks");
}

export async function addNote(formData: FormData) {
  const user = await requireAdmin();
  const body = str(formData, "body");
  const leadId = opt(formData, "leadId");
  const contactId = opt(formData, "contactId");
  const companyId = opt(formData, "companyId");
  const dealId = opt(formData, "dealId");
  await prisma.note.create({
    data: {
      body,
      leadId,
      contactId,
      companyId,
      dealId,
      createdById: user.id,
    },
  });
  await logActivity({
    type: "NOTE",
    summary: "Note added",
    body,
    leadId,
    contactId,
    companyId,
    dealId,
    createdById: user.id,
  });
  revalidatePath("/");
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  await prisma.appSettings.update({
    where: { id: "default" },
    data: {
      companyName: str(formData, "companyName") || "Workin Cove",
      businessTimezone: str(formData, "businessTimezone") || "Asia/Karachi",
      metaWebhookEnabled: formData.get("metaWebhookEnabled") === "on",
      metaVerifyToken: str(formData, "metaVerifyToken") || "workin-cove-meta-verify",
      googleAdsWebhookEnabled: formData.get("googleAdsWebhookEnabled") === "on",
      googleAdsSharedSecret:
        str(formData, "googleAdsSharedSecret") || "workin-cove-google-secret",
    },
  });
  revalidatePath("/settings");
  redirect("/settings");
}

export async function upsertCustomField(formData: FormData) {
  await requireAdmin();
  const id = opt(formData, "id");
  const data = {
    entityType: str(formData, "entityType"),
    key: str(formData, "key"),
    label: str(formData, "label"),
    fieldType: str(formData, "fieldType") || "text",
    optionsJson: opt(formData, "optionsJson"),
    required: formData.get("required") === "on",
    sortOrder: Number(str(formData, "sortOrder") || 0),
  };
  if (id) {
    await prisma.customFieldDefinition.update({ where: { id }, data });
  } else {
    await prisma.customFieldDefinition.create({ data });
  }
  revalidatePath("/settings");
  redirect("/settings?tab=fields");
}

export async function upsertTag(formData: FormData) {
  await requireAdmin();
  const id = opt(formData, "id");
  const data = {
    name: str(formData, "name"),
    color: str(formData, "color") || "#0f766e",
  };
  if (id) await prisma.tag.update({ where: { id }, data });
  else await prisma.tag.create({ data });
  revalidatePath("/settings");
  redirect("/settings?tab=tags");
}

export async function upsertPipelineStage(formData: FormData) {
  await requireAdmin();
  const pipelineId = str(formData, "pipelineId");
  const id = opt(formData, "id");
  const data = {
    name: str(formData, "name"),
    sortOrder: Number(str(formData, "sortOrder") || 0),
    probability: Number(str(formData, "probability") || 0),
    color: str(formData, "color") || "#64748b",
    isWon: formData.get("isWon") === "on",
    isLost: formData.get("isLost") === "on",
    pipelineId,
  };
  if (id) await prisma.stage.update({ where: { id }, data });
  else await prisma.stage.create({ data });
  revalidatePath("/settings");
  redirect("/settings?tab=pipelines");
}

export async function createPipeline(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  const isDefault = formData.get("isDefault") === "on";
  if (isDefault) {
    await prisma.pipeline.updateMany({ data: { isDefault: false } });
  }
  await prisma.pipeline.create({
    data: {
      name,
      description: opt(formData, "description"),
      isDefault,
      stages: {
        create: [
          { name: "New", sortOrder: 1, probability: 10 },
          { name: "Won", sortOrder: 90, probability: 100, isWon: true, color: "#15803d" },
          { name: "Lost", sortOrder: 100, probability: 0, isLost: true, color: "#b91c1c" },
        ],
      },
    },
  });
  revalidatePath("/settings");
  redirect("/settings?tab=pipelines");
}

export async function parseCustomFieldsFromForm(
  formData: FormData,
  entityType: string,
) {
  const defs = await prisma.customFieldDefinition.findMany({
    where: { entityType },
  });
  const values: Record<string, unknown> = {};
  for (const def of defs) {
    const raw = formData.get(`cf_${def.key}`);
    if (raw == null || raw === "") continue;
    values[def.key] =
      def.fieldType === "number" ? Number(String(raw)) : String(raw);
  }
  return JSON.stringify(values);
}

export async function getCustomFieldValues(json: string | null | undefined) {
  return parseJson<Record<string, unknown>>(json, {});
}
