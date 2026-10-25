import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subHours } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const TZ = "Asia/Karachi";

function atKarachi(daysFromToday: number, hour = 10) {
  const base = new Date();
  const local = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + daysFromToday,
    hour,
    0,
    0,
  );
  return fromZonedTime(local, TZ);
}

async function main() {
  await prisma.journalLine.deleteMany();
  await prisma.rentPayment.deleteMany();
  await prisma.rentInvoice.deleteMany();
  await prisma.rentEscalation.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.propertyTransaction.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.document.deleteMany();
  await prisma.property.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.account.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.dealStageHistory.deleteMany();
  await prisma.taskReschedule.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dealTag.deleteMany();
  await prisma.leadTag.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.customFieldDefinition.deleteMany();
  await prisma.moduleLink.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();

  await prisma.appSettings.create({
    data: {
      id: "default",
      companyName: "Workin Cove",
      businessTimezone: TZ,
      baseCurrency: "PKR",
      metaWebhookEnabled: true,
      googleAdsWebhookEnabled: true,
    },
  });

  const accounts = [
    { code: "1000", name: "Cash", type: "ASSET" },
    { code: "1010", name: "Bank", type: "ASSET" },
    { code: "1100", name: "Rent receivable", type: "ASSET" },
    { code: "1500", name: "Property assets", type: "ASSET" },
    { code: "4000", name: "Rent revenue", type: "REVENUE" },
    { code: "4100", name: "Gain on property sale", type: "REVENUE" },
    { code: "5000", name: "Operating expense", type: "EXPENSE" },
    { code: "5100", name: "Loss on property sale", type: "EXPENSE" },
  ];
  for (const a of accounts) {
    await prisma.account.create({ data: a });
  }

  const passwordHash = await bcrypt.hash("1122", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@workincove.local",
      name: "Cove Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  const agent = await prisma.user.create({
    data: {
      email: "agent@workincove.local",
      name: "Sara Agent",
      passwordHash,
      role: "AGENT",
      status: "ACTIVE",
    },
  });

  const [hq, services, partnerships] = await Promise.all([
    prisma.workspace.create({
      data: {
        name: "Headquarters Operations",
        code: "HQ",
        description: "Primary company operational context",
      },
    }),
    prisma.workspace.create({
      data: {
        name: "Client Services",
        code: "SVC",
        description: "Service delivery and customer success",
      },
    }),
    prisma.workspace.create({
      data: {
        name: "Partnerships Desk",
        code: "PART",
        description: "Channel and partner acquisition",
      },
    }),
  ]);

  const tags = await Promise.all(
    [
      ["hot", "#b45309"],
      ["inbound", "#0f766e"],
      ["enterprise", "#1d4ed8"],
      ["follow-up", "#7c3aed"],
    ].map(([name, color]) => prisma.tag.create({ data: { name, color } })),
  );

  await prisma.customFieldDefinition.createMany({
    data: [
      {
        entityType: "lead",
        key: "preferred_channel",
        label: "Preferred channel",
        fieldType: "select",
        optionsJson: JSON.stringify(["Email", "Phone", "WhatsApp"]),
        sortOrder: 1,
      },
      {
        entityType: "contact",
        key: "linkedin",
        label: "LinkedIn URL",
        fieldType: "text",
        sortOrder: 1,
      },
      {
        entityType: "company",
        key: "employees",
        label: "Employee count",
        fieldType: "number",
        sortOrder: 1,
      },
      {
        entityType: "deal",
        key: "contract_term",
        label: "Contract term (months)",
        fieldType: "number",
        sortOrder: 1,
      },
    ],
  });

  const pipeline = await prisma.pipeline.create({
    data: {
      name: "Primary Sales",
      description: "Default customer acquisition pipeline",
      isDefault: true,
      stages: {
        create: [
          { name: "New", sortOrder: 1, probability: 10, color: "#64748b" },
          { name: "Contacted", sortOrder: 2, probability: 25, color: "#0284c7" },
          { name: "Qualified", sortOrder: 3, probability: 40, color: "#0f766e" },
          {
            name: "Meeting Scheduled",
            sortOrder: 4,
            probability: 55,
            color: "#7c3aed",
          },
          {
            name: "Proposal Sent",
            sortOrder: 5,
            probability: 70,
            color: "#b45309",
          },
          {
            name: "Negotiation",
            sortOrder: 6,
            probability: 80,
            color: "#c2410c",
          },
          {
            name: "Won",
            sortOrder: 7,
            probability: 100,
            isWon: true,
            color: "#15803d",
          },
          {
            name: "Lost",
            sortOrder: 8,
            probability: 0,
            isLost: true,
            color: "#b91c1c",
          },
        ],
      },
    },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });

  const stages = pipeline.stages;

  const acme = await prisma.company.create({
    data: {
      name: "Acme Trading Co",
      website: "https://acme.example",
      email: "hello@acme.example",
      phone: "+92-21-5550100",
      industry: "Wholesale",
      workspaceId: hq.id,
      customFieldsJson: JSON.stringify({ employees: 120 }),
      tags: { create: [{ tagId: tags[2].id }] },
    },
  });

  const northwind = await prisma.company.create({
    data: {
      name: "Northwind Services",
      email: "ops@northwind.example",
      industry: "Professional services",
      workspaceId: services.id,
    },
  });

  const sara = await prisma.contact.create({
    data: {
      firstName: "Sara",
      lastName: "Khan",
      email: "sara@acme.example",
      phone: "+92-300-5550101",
      title: "Procurement Lead",
      isCustomer: true,
      companyId: acme.id,
      workspaceId: hq.id,
      customFieldsJson: JSON.stringify({
        linkedin: "https://linkedin.com/in/sarakhan",
      }),
      tags: { create: [{ tagId: tags[2].id }] },
    },
  });

  const bilal = await prisma.contact.create({
    data: {
      firstName: "Bilal",
      lastName: "Ahmed",
      email: "bilal@northwind.example",
      phone: "+92-333-5550202",
      title: "Founder",
      companyId: northwind.id,
      workspaceId: services.id,
    },
  });

  const leadNew = await prisma.lead.create({
    data: {
      firstName: "Ayesha",
      lastName: "Malik",
      email: "ayesha@example.com",
      phone: "+92-321-5550303",
      companyName: "Malik Consulting",
      status: "NEW",
      source: "META",
      campaign: "Spring Lead Form",
      externalRef: "meta_lead_1001",
      attributionJson: JSON.stringify({
        form_id: "form_88",
        ad_id: "ad_12",
      }),
      workspaceId: hq.id,
      assigneeId: admin.id,
      customFieldsJson: JSON.stringify({ preferred_channel: "WhatsApp" }),
      tags: { create: [{ tagId: tags[0].id }, { tagId: tags[1].id }] },
    },
  });

  const leadQualified = await prisma.lead.create({
    data: {
      firstName: "Omar",
      lastName: "Raza",
      email: "omar@raza.example",
      phone: "+92-345-5550404",
      companyName: "Raza Logistics",
      status: "QUALIFIED",
      source: "GOOGLE_ADS",
      campaign: "Search Brand",
      externalRef: "gads_lead_2002",
      workspaceId: partnerships.id,
      assigneeId: admin.id,
      tags: { create: [{ tagId: tags[1].id }] },
    },
  });

  const leadManual = await prisma.lead.create({
    data: {
      firstName: "Nadia",
      lastName: "Iqbal",
      email: "nadia@iqbal.example",
      phone: "+92-301-5550505",
      status: "CONTACTED",
      source: "MANUAL",
      campaign: "Referral",
      workspaceId: services.id,
      assigneeId: agent.id,
    },
  });

  const convertedLead = await prisma.lead.create({
    data: {
      firstName: "Sara",
      lastName: "Khan",
      email: "sara@acme.example",
      phone: "+92-300-5550101",
      companyName: "Acme Trading Co",
      status: "CONVERTED",
      source: "IMPORT",
      convertedContactId: sara.id,
      convertedAt: subDays(new Date(), 12),
      workspaceId: hq.id,
      assigneeId: admin.id,
    },
  });

  const deal1 = await prisma.deal.create({
    data: {
      title: "Acme annual service retainer",
      value: 850000,
      expectedCloseDate: addDays(new Date(), 18),
      nextAction: "Send revised proposal",
      pipelineId: pipeline.id,
      stageId: stages[4].id,
      probability: 70,
      contactId: sara.id,
      companyId: acme.id,
      workspaceId: hq.id,
      leadId: convertedLead.id,
      customFieldsJson: JSON.stringify({ contract_term: 12 }),
      tags: { create: [{ tagId: tags[2].id }] },
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: "Northwind onboarding package",
      value: 240000,
      expectedCloseDate: addDays(new Date(), 7),
      nextAction: "Discovery call",
      pipelineId: pipeline.id,
      stageId: stages[2].id,
      probability: 40,
      contactId: bilal.id,
      companyId: northwind.id,
      workspaceId: services.id,
      leadId: leadManual.id,
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      title: "Raza Logistics partnership",
      value: 520000,
      expectedCloseDate: addDays(new Date(), 30),
      nextAction: "Schedule intro meeting",
      pipelineId: pipeline.id,
      stageId: stages[1].id,
      probability: 25,
      workspaceId: partnerships.id,
      leadId: leadQualified.id,
    },
  });

  await prisma.dealStageHistory.createMany({
    data: [
      {
        dealId: deal1.id,
        toStageId: stages[0].id,
        changedById: admin.id,
        createdAt: subDays(new Date(), 20),
      },
      {
        dealId: deal1.id,
        fromStageId: stages[0].id,
        toStageId: stages[4].id,
        changedById: admin.id,
        note: "Moved after proposal review",
        createdAt: subDays(new Date(), 3),
      },
      {
        dealId: deal2.id,
        toStageId: stages[2].id,
        changedById: admin.id,
      },
      {
        dealId: deal3.id,
        toStageId: stages[1].id,
        changedById: admin.id,
      },
    ],
  });

  const overdue = await prisma.task.create({
    data: {
      title: "Call Ayesha about Meta inquiry",
      type: "CALL",
      status: "OPEN",
      priority: "HIGH",
      dueAt: atKarachi(-1, 11),
      leadId: leadNew.id,
      workspaceId: hq.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Follow up with Sara on proposal",
      type: "FOLLOW_UP",
      status: "OPEN",
      priority: "HIGH",
      dueAt: atKarachi(0, 14),
      dealId: deal1.id,
      contactId: sara.id,
      workspaceId: hq.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Meeting with Bilal",
      type: "MEETING",
      status: "OPEN",
      priority: "MEDIUM",
      dueAt: atKarachi(1, 15),
      dealId: deal2.id,
      contactId: bilal.id,
      workspaceId: services.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Send partnership one-pager",
      type: "EMAIL",
      status: "OPEN",
      priority: "MEDIUM",
      dueAt: atKarachi(4, 10),
      leadId: leadQualified.id,
      workspaceId: partnerships.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Quarterly account review prep",
      type: "TODO",
      status: "OPEN",
      priority: "LOW",
      dueAt: atKarachi(20, 9),
      companyId: acme.id,
      workspaceId: hq.id,
      assigneeId: admin.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Unscheduled nurture for Nadia",
      type: "FOLLOW_UP",
      status: "OPEN",
      priority: "LOW",
      dueAt: null,
      leadId: leadManual.id,
      workspaceId: services.id,
      assigneeId: admin.id,
    },
  });

  const completed = await prisma.task.create({
    data: {
      title: "Qualify Omar lead",
      type: "TODO",
      status: "COMPLETED",
      priority: "MEDIUM",
      dueAt: atKarachi(-2, 12),
      completedAt: subHours(new Date(), 30),
      outcome: "Qualified for partnership pipeline",
      leadId: leadQualified.id,
      workspaceId: partnerships.id,
      assigneeId: admin.id,
    },
  });

  await prisma.taskReschedule.create({
    data: {
      taskId: overdue.id,
      previousDue: atKarachi(-3, 11),
      newDue: atKarachi(-1, 11),
      reason: "Missed first attempt",
      changedById: admin.id,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "NOTE",
        summary: "Lead created from Meta form",
        leadId: leadNew.id,
        workspaceId: hq.id,
        createdById: admin.id,
        createdAt: subDays(new Date(), 2),
      },
      {
        type: "STATUS_CHANGE",
        summary: "Lead marked QUALIFIED",
        leadId: leadQualified.id,
        workspaceId: partnerships.id,
        createdById: admin.id,
        createdAt: subDays(new Date(), 1),
      },
      {
        type: "CALL",
        summary: "Intro call with Sara",
        body: "Discussed retainer scope and timeline",
        contactId: sara.id,
        dealId: deal1.id,
        workspaceId: hq.id,
        createdById: admin.id,
        createdAt: subHours(new Date(), 20),
      },
      {
        type: "TASK_COMPLETED",
        summary: "Completed: Qualify Omar lead",
        taskId: completed.id,
        leadId: leadQualified.id,
        createdById: admin.id,
        createdAt: subHours(new Date(), 30),
      },
      {
        type: "DEAL_STAGE",
        summary: "Deal moved to Proposal Sent",
        dealId: deal1.id,
        createdById: admin.id,
        createdAt: subDays(new Date(), 3),
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        body: "Prefers WhatsApp for quick replies after 5pm.",
        leadId: leadNew.id,
        createdById: admin.id,
      },
      {
        body: "Customer wants quarterly invoicing.",
        contactId: sara.id,
        dealId: deal1.id,
        createdById: admin.id,
      },
    ],
  });

  const maintenance = await prisma.expenseCategory.create({
    data: { name: "Maintenance" },
  });
  const utilities = await prisma.expenseCategory.create({
    data: { name: "Utilities" },
  });
  const vendor = await prisma.vendor.create({
    data: {
      name: "Cove Facilities Ltd",
      phone: "+92-21-5550999",
      email: "jobs@covefacilities.example",
    },
  });

  const property = await prisma.property.create({
    data: {
      code: "CLT-01",
      name: "Clifton Commerce Floor",
      addressLine1: "12 Khayaban-e-Iqbal",
      city: "Karachi",
      area: "Clifton",
      propertyType: "COMMERCIAL",
      sizeSqFt: 2200,
      status: "OCCUPIED",
      acquisitionDate: subDays(new Date(), 400),
      acquisitionCostMinor: BigInt(4_500_000_000),
      notes: "Company-owned inventory — seat workspaces and unit leases attach here.",
    },
  });

  const openDesk = await prisma.seatWorkspace.create({
    data: {
      name: "Clifton Open Desk",
      code: "CLT-OPEN",
      propertyId: property.id,
      capacity: 24,
      pricePerSeatMinor: BigInt(25_000_00),
      billingCycle: "MONTHLY",
      status: "ACTIVE",
      description: "Hot desks for developers and freelancers — charged per seat / month.",
    },
  });

  await prisma.seatMembership.create({
    data: {
      seatWorkspaceId: openDesk.id,
      contactId: bilal.id,
      seats: 2,
      monthlyChargeMinor: BigInt(50_000_00),
      startDate: subDays(new Date(), 20),
      status: "ACTIVE",
      notes: "Two developer desks",
    },
  });

  await prisma.journalEntry.create({
    data: {
      memo: "Seed property acquisition",
      sourceType: "PROPERTY_ACQUISITION",
      sourceId: property.id,
      idempotencyKey: `seed-prop-acq-${property.id}`,
      lines: {
        create: [
          {
            accountId: (await prisma.account.findUniqueOrThrow({ where: { code: "1500" } })).id,
            debitMinor: property.acquisitionCostMinor,
          },
          {
            accountId: (await prisma.account.findUniqueOrThrow({ where: { code: "1010" } })).id,
            creditMinor: property.acquisitionCostMinor,
          },
        ],
      },
    },
  });

  const tenant = await prisma.tenant.create({
    data: {
      contactId: bilal.id,
      status: "ACTIVE",
      notes: "Tenant linked to shared CRM contact",
    },
  });

  const lease = await prisma.lease.create({
    data: {
      propertyId: property.id,
      tenantId: tenant.id,
      status: "ACTIVE",
      startDate: subDays(new Date(), 90),
      endDate: addDays(new Date(), 275),
      rentAmountMinor: BigInt(250_000_00),
      dueDayOfMonth: 5,
      securityDepositMinor: BigInt(500_000_00),
      escalationPercent: 5,
    },
  });

  const invoice = await prisma.rentInvoice.create({
    data: {
      leaseId: lease.id,
      propertyId: property.id,
      periodStart: atKarachi(-20, 0),
      periodEnd: atKarachi(-1, 23),
      dueDate: atKarachi(-15, 0),
      amountMinor: BigInt(250_000_00),
      balanceMinor: BigInt(100_000_00),
      status: "PARTIAL",
      idempotencyKey: "seed-rent-inv-1",
    },
  });

  const bank = await prisma.account.findUniqueOrThrow({ where: { code: "1010" } });
  const recv = await prisma.account.findUniqueOrThrow({ where: { code: "1100" } });
  const rev = await prisma.account.findUniqueOrThrow({ where: { code: "4000" } });

  await prisma.journalEntry.create({
    data: {
      memo: "Seed rent invoice",
      sourceType: "RENT_INVOICE",
      sourceId: invoice.id,
      idempotencyKey: "seed-je-rent-inv-1",
      lines: {
        create: [
          { accountId: recv.id, debitMinor: BigInt(250_000_00) },
          { accountId: rev.id, creditMinor: BigInt(250_000_00) },
        ],
      },
    },
  });

  const payJe = await prisma.journalEntry.create({
    data: {
      memo: "Seed rent payment",
      sourceType: "RENT_PAYMENT",
      sourceId: "seed-pay-1",
      idempotencyKey: "seed-je-rent-pay-1",
      lines: {
        create: [
          { accountId: bank.id, debitMinor: BigInt(150_000_00) },
          { accountId: recv.id, creditMinor: BigInt(150_000_00) },
        ],
      },
    },
  });

  await prisma.rentPayment.create({
    data: {
      invoiceId: invoice.id,
      amountMinor: BigInt(150_000_00),
      method: "BANK",
      reference: "TRX-SEED-1",
      journalEntryId: payJe.id,
      idempotencyKey: "seed-pay-1",
    },
  });

  const expJe = await prisma.journalEntry.create({
    data: {
      memo: "Seed elevator maintenance",
      sourceType: "EXPENSE",
      sourceId: "seed-exp-1",
      idempotencyKey: "seed-je-exp-1",
      lines: {
        create: [
          {
            accountId: (await prisma.account.findUniqueOrThrow({ where: { code: "5000" } })).id,
            debitMinor: BigInt(35_000_00),
          },
          { accountId: bank.id, creditMinor: BigInt(35_000_00) },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      title: "Elevator service visit",
      categoryId: maintenance.id,
      vendorId: vendor.id,
      propertyId: property.id,
      amountMinor: BigInt(35_000_00),
      incurredOn: subDays(new Date(), 4),
      journalEntryId: expJe.id,
    },
  });

  await prisma.expense.create({
    data: {
      title: "Common area electricity",
      categoryId: utilities.id,
      propertyId: property.id,
      amountMinor: BigInt(18_500_00),
      incurredOn: subDays(new Date(), 2),
      isRecurring: true,
      recurrenceRule: "MONTHLY",
    },
  });

  await prisma.workOrder.create({
    data: {
      title: "Replace lobby lighting",
      description: "LED retrofit for ground floor lobby",
      propertyId: property.id,
      leaseId: lease.id,
      vendorId: vendor.id,
      status: "OPEN",
      priority: "MEDIUM",
      costMinor: BigInt(12_000_00),
    },
  });

  await prisma.moduleLink.create({
    data: {
      moduleKey: "property_inventory",
      moduleLabel: "Property Inventory",
      crmEntityType: "contact",
      crmEntityId: bilal.id,
      externalRef: `property:${property.id}`,
      metadataJson: JSON.stringify({
        leaseId: lease.id,
        note: "Tenant contact shared between CRM and rental module",
      }),
    },
  });

  console.log("Seeded Workin Cove demo data");
  console.log("Admin login: admin@workincove.local / 1122");
  console.log("Agent login: agent@workincove.local / 1122");
  console.log(`Seat workspace demo: ${openDesk.name}`);
  console.log(`Lead assigned to agent: ${leadManual.firstName} ${leadManual.lastName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
