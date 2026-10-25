import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireApiAdmin } from "@/lib/auth";
import {
  commitLeadImport,
  parseImportFile,
  previewLeadImport,
  suggestMapping,
} from "@/lib/import-leads";

const TMP = path.join(process.cwd(), "uploads", "import-tmp");

async function loadToken(fileToken: string) {
  const raw = await readFile(path.join(TMP, `${fileToken}.json`), "utf8");
  return JSON.parse(raw) as {
    filename: string;
    headers: string[];
    rows: Record<string, string>[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("sample") === "1") {
    const csv =
      "First name,Last name,Email,Phone,Company,Source,Campaign\n" +
      "Demo,Lead,demo.lead@example.com,+92-300-0000000,Demo Co,IMPORT,Sample\n";
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="leads-sample.csv"',
      },
    });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseImportFile(buffer, file.name);
    await mkdir(TMP, { recursive: true });
    const fileToken = randomBytes(12).toString("hex");
    await writeFile(
      path.join(TMP, `${fileToken}.json`),
      JSON.stringify({
        filename: file.name,
        headers: parsed.headers,
        rows: parsed.rows,
      }),
    );
    return NextResponse.json({
      fileToken,
      headers: parsed.headers,
      suggestedMapping: suggestMapping(parsed.headers),
      rowCount: parsed.rows.length,
    });
  }

  const body = await request.json();
  if (!body.fileToken) {
    return NextResponse.json({ error: "fileToken required" }, { status: 400 });
  }
  const stored = await loadToken(body.fileToken);

  if (body.mode === "preview") {
    const rows = await previewLeadImport(stored.rows, body.mapping || {});
    return NextResponse.json({ rows });
  }

  if (body.mode === "commit") {
    const result = await commitLeadImport({
      filename: stored.filename,
      rows: stored.rows,
      mapping: body.mapping || {},
      skipDuplicates: Boolean(body.skipDuplicates),
      userId: user.id,
      workspaceId: body.workspaceId || null,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
}
