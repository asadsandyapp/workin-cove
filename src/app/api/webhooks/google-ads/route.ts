import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  if (!settings?.googleAdsWebhookEnabled) {
    return NextResponse.json(
      { error: "Google Ads webhook disabled" },
      { status: 503 },
    );
  }

  const secret = request.headers.get("x-google-ads-secret") || "";
  if (secret !== settings.googleAdsSharedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leads = Array.isArray(payload.leads) ? payload.leads : [payload];
  let created = 0;

  for (const item of leads) {
    const externalId = String(item.lead_id || item.id || item.gclid || "");
    if (!externalId) continue;
    const externalRef = `gads_${externalId}`;
    const existing = await prisma.lead.findFirst({ where: { externalRef } });
    if (existing) continue;

    const lead = await prisma.lead.create({
      data: {
        firstName: String(item.first_name || item.full_name || "Google"),
        lastName: item.last_name ? String(item.last_name) : null,
        email: item.email ? String(item.email) : null,
        phone: item.phone ? String(item.phone) : null,
        companyName: item.company ? String(item.company) : null,
        source: "GOOGLE_ADS",
        campaign: item.campaign ? String(item.campaign) : null,
        externalRef,
        attributionJson: JSON.stringify(item),
        status: "NEW",
      },
    });
    await logActivity({
      type: "LEAD_CREATED",
      summary: "Lead captured from Google Ads lead form webhook",
      leadId: lead.id,
    });
    created += 1;
  }

  return NextResponse.json({ ok: true, created });
}
