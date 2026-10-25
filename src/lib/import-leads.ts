import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const LEAD_IMPORT_FIELDS = [
  { key: "firstName", label: "First name", required: true },
  { key: "lastName", label: "Last name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "companyName", label: "Company", required: false },
  { key: "title", label: "Title", required: false },
  { key: "source", label: "Source", required: false },
  { key: "campaign", label: "Campaign", required: false },
  { key: "status", label: "Status", required: false },
  { key: "notes", label: "Notes", required: false },
] as const;

export type LeadImportField = (typeof LEAD_IMPORT_FIELDS)[number]["key"];

export type ParsedImport = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseImportFile(buffer: Buffer, filename: string): ParsedImport {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = buffer.toString("utf8");
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    return {
      headers: parsed.meta.fields?.filter(Boolean) ?? [],
      rows: parsed.data.map((row) => {
        const clean: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          clean[k] = String(v ?? "").trim();
        }
        return clean;
      }),
    };
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const headers =
    json.length > 0 ? Object.keys(json[0]).map((h) => String(h).trim()) : [];
  const rows = json.map((row) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[String(k).trim()] = String(v ?? "").trim();
    }
    return clean;
  });
  return { headers, rows };
}

export function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const aliases: Record<string, string[]> = {
    firstName: ["first name", "firstname", "first", "given name", "name"],
    lastName: ["last name", "lastname", "last", "surname", "family name"],
    email: ["email", "e-mail", "email address"],
    phone: ["phone", "mobile", "cell", "telephone", "phone number"],
    companyName: ["company", "company name", "organization", "organisation"],
    title: ["title", "job title", "role"],
    source: ["source", "lead source"],
    campaign: ["campaign", "utm_campaign"],
    status: ["status", "lead status"],
    notes: ["notes", "note", "comments", "comment"],
  };

  for (const field of LEAD_IMPORT_FIELDS) {
    const opts = aliases[field.key] ?? [field.key];
    const match = headers.find((h) =>
      opts.includes(h.toLowerCase().trim()),
    );
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

export type PreviewRowResult = {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  duplicate: boolean;
  duplicateReason?: string;
};

function mappedValue(
  row: Record<string, string>,
  mapping: Record<string, string>,
  key: string,
) {
  const header = mapping[key];
  if (!header) return "";
  return (row[header] ?? "").trim();
}

export async function previewLeadImport(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
): Promise<PreviewRowResult[]> {
  const results: PreviewRowResult[] = [];
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const data: Record<string, string> = {};
    for (const field of LEAD_IMPORT_FIELDS) {
      data[field.key] = mappedValue(row, mapping, field.key);
    }

    const errors: string[] = [];
    if (!data.firstName) errors.push("First name is required");
    if (!data.email && !data.phone) {
      errors.push("Email or phone is required");
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Invalid email");
    }

    let duplicate = false;
    let duplicateReason: string | undefined;

    if (data.email) {
      const key = data.email.toLowerCase();
      if (seenEmails.has(key)) {
        duplicate = true;
        duplicateReason = "Duplicate email in file";
      } else {
        seenEmails.add(key);
        const existing = await prisma.lead.findFirst({
          where: { email: { equals: data.email } },
        });
        if (existing) {
          duplicate = true;
          duplicateReason = "Email already exists in CRM";
        }
      }
    }

    if (!duplicate && data.phone) {
      if (seenPhones.has(data.phone)) {
        duplicate = true;
        duplicateReason = "Duplicate phone in file";
      } else {
        seenPhones.add(data.phone);
        const existing = await prisma.lead.findFirst({
          where: { phone: data.phone },
        });
        if (existing) {
          duplicate = true;
          duplicateReason = "Phone already exists in CRM";
        }
      }
    }

    results.push({ rowIndex: i + 1, data, errors, duplicate, duplicateReason });
  }

  return results;
}

export async function commitLeadImport(opts: {
  filename: string;
  rows: Record<string, string>[];
  mapping: Record<string, string>;
  skipDuplicates: boolean;
  userId?: string;
  workspaceId?: string | null;
}) {
  const preview = await previewLeadImport(opts.rows, opts.mapping);
  const errors: { row: number; messages: string[] }[] = [];
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const item of preview) {
    if (item.errors.length) {
      errorCount += 1;
      errors.push({ row: item.rowIndex, messages: item.errors });
      continue;
    }
    if (item.duplicate) {
      duplicateCount += 1;
      if (opts.skipDuplicates) continue;
      errors.push({
        row: item.rowIndex,
        messages: [item.duplicateReason ?? "Duplicate"],
      });
      errorCount += 1;
      continue;
    }

    const lead = await prisma.lead.create({
      data: {
        firstName: item.data.firstName,
        lastName: item.data.lastName || null,
        email: item.data.email || null,
        phone: item.data.phone || null,
        companyName: item.data.companyName || null,
        title: item.data.title || null,
        source: item.data.source || "IMPORT",
        campaign: item.data.campaign || null,
        status: item.data.status || "NEW",
        notes: item.data.notes || null,
        workspaceId: opts.workspaceId || null,
        assigneeId: opts.userId || null,
      },
    });

    await logActivity({
      type: "LEAD_CREATED",
      summary: `Lead imported: ${item.data.firstName}`,
      leadId: lead.id,
      workspaceId: opts.workspaceId,
      createdById: opts.userId,
    });
    successCount += 1;
  }

  const job = await prisma.importJob.create({
    data: {
      filename: opts.filename,
      status: "COMPLETED",
      totalRows: opts.rows.length,
      successCount,
      errorCount,
      duplicateCount,
      mappingJson: JSON.stringify(opts.mapping),
      errorsJson: JSON.stringify(errors),
      summaryJson: JSON.stringify({
        successCount,
        errorCount,
        duplicateCount,
        skippedDuplicates: opts.skipDuplicates,
      }),
      completedAt: new Date(),
    },
  });

  return { job, errors, successCount, errorCount, duplicateCount };
}
