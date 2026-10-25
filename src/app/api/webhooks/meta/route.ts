import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET(request: Request) {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.metaWebhookEnabled) {
    return NextResponse.json({ error: "Meta webhook disabled" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === settings.metaVerifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.metaWebhookEnabled) {
    return NextResponse.json({ error: "Meta webhook disabled" }, { status: 503 });
  }

  const payload = await request.json().catch(() => null);
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  let created = 0;

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const leadgenId = String(value.leadgen_id || value.lead_id || "");
      if (!leadgenId) continue;

      const existing = await prisma.lead.findFirst({
        where: { externalRef: `meta_${leadgenId}` },
      });
      if (existing) continue;

      const fieldData = Array.isArray(value.field_data) ? value.field_data : [];
      const map: Record<string, string> = {};
      for (const f of fieldData) {
        map[String(f.name || "").toLowerCase()] = String(
          Array.isArray(f.values) ? f.values[0] : f.value || "",
        );
      }

      const full = map.full_name || map.name || "";
      const [firstName, ...rest] = (map.first_name || full || "Meta").split(" ");
      const lastName = map.last_name || rest.join(" ") || null;

      const lead = await prisma.lead.create({
        data: {
          firstName,
          lastName,
          email: map.email || null,
          phone: map.phone_number || map.phone || null,
          source: "META",
          campaign: String(value.campaign_name || value.form_id || ""),
          externalRef: `meta_${leadgenId}`,
          attributionJson: JSON.stringify(value),
          status: "NEW",
        },
      });
      await logActivity({
        type: "LEAD_CREATED",
        summary: "Lead captured from Meta lead form webhook",
        leadId: lead.id,
      });
      created += 1;
    }
  }

  // Also accept simplified payloads for local testing
  if (!entries.length && payload?.leadgen_id) {
    const leadgenId = String(payload.leadgen_id);
    const existing = await prisma.lead.findFirst({
      where: { externalRef: `meta_${leadgenId}` },
    });
    if (!existing) {
      const lead = await prisma.lead.create({
        data: {
          firstName: String(payload.first_name || payload.name || "Meta"),
          lastName: payload.last_name ? String(payload.last_name) : null,
          email: payload.email ? String(payload.email) : null,
          phone: payload.phone ? String(payload.phone) : null,
          source: "META",
          campaign: payload.campaign ? String(payload.campaign) : null,
          externalRef: `meta_${leadgenId}`,
          attributionJson: JSON.stringify(payload),
          status: "NEW",
        },
      });
      await logActivity({
        type: "LEAD_CREATED",
        summary: "Lead captured from Meta webhook (simplified)",
        leadId: lead.id,
      });
      created += 1;
    }
  }

  return NextResponse.json({ ok: true, created });
}
