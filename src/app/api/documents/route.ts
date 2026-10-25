import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireApiAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const entityType = String(form.get("entityType") || "");
  const entityId = String(form.get("entityId") || "");
  if (!(file instanceof File) || !entityType || !entityId) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  await mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const storagePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  const link: Record<string, string> = {};
  if (entityType === "lead") link.leadId = entityId;
  else if (entityType === "contact") link.contactId = entityId;
  else if (entityType === "company") link.companyId = entityId;
  else if (entityType === "deal") link.dealId = entityId;
  else if (entityType === "property") link.propertyId = entityId;
  else if (entityType === "expense") link.expenseId = entityId;
  else if (entityType === "lease") link.leaseId = entityId;
  else {
    return NextResponse.json({ error: "Unsupported entity" }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type || null,
      sizeBytes: buffer.length,
      storagePath,
      uploadedById: user.id,
      ...link,
    },
  });

  return NextResponse.json({ id: doc.id });
}
