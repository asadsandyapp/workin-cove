import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const user = await requireApiAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await request.formData();
  const dealId = String(form.get("dealId") || "");
  const stageId = String(form.get("stageId") || "");
  const lossReason = String(form.get("lossReason") || "") || null;
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!deal || !stage) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
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
  return NextResponse.json({ ok: true });
}
