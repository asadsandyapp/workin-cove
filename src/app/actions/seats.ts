"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toMinor } from "@/lib/money";
import { logActivity } from "@/lib/activity";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function opt(formData: FormData, key: string) {
  const v = str(formData, key);
  return v || null;
}

export async function createSeatWorkspace(formData: FormData) {
  const user = await requireAdmin();
  const capacity = Number(str(formData, "capacity") || 0);
  const pricePerSeat = str(formData, "pricePerSeat") || "0";
  if (!str(formData, "name") || capacity < 1) {
    throw new Error("Name and capacity are required");
  }

  const seat = await prisma.seatWorkspace.create({
    data: {
      name: str(formData, "name"),
      code: opt(formData, "code"),
      propertyId: opt(formData, "propertyId"),
      capacity,
      pricePerSeatMinor: toMinor(pricePerSeat),
      billingCycle: str(formData, "billingCycle") || "MONTHLY",
      status: "ACTIVE",
      description: opt(formData, "description"),
      notes: opt(formData, "notes"),
    },
  });

  await logActivity({
    type: "SEAT_WORKSPACE_CREATED",
    summary: `Seat workspace created: ${seat.name}`,
    createdById: user.id,
  });

  revalidatePath("/seat-workspaces");
  redirect(`/seat-workspaces/${seat.id}`);
}

export async function addSeatMembership(formData: FormData) {
  await requireUser();
  const seatWorkspaceId = str(formData, "seatWorkspaceId");
  const contactId = str(formData, "contactId");
  const seats = Math.max(1, Number(str(formData, "seats") || 1));
  if (!seatWorkspaceId || !contactId) {
    throw new Error("Workspace and contact are required");
  }

  const workspace = await prisma.seatWorkspace.findUniqueOrThrow({
    where: { id: seatWorkspaceId },
    include: {
      memberships: { where: { status: "ACTIVE" } },
    },
  });

  const used = workspace.memberships.reduce((sum, m) => sum + m.seats, 0);
  if (used + seats > workspace.capacity) {
    throw new Error(
      `Not enough seats left (${workspace.capacity - used} available)`,
    );
  }

  const customCharge = opt(formData, "monthlyCharge");
  const monthlyChargeMinor = customCharge
    ? toMinor(customCharge)
    : workspace.pricePerSeatMinor * BigInt(seats);

  await prisma.seatMembership.create({
    data: {
      seatWorkspaceId,
      contactId,
      seats,
      monthlyChargeMinor,
      startDate: new Date(str(formData, "startDate") || new Date().toISOString()),
      endDate: opt(formData, "endDate") ? new Date(str(formData, "endDate")!) : null,
      status: "ACTIVE",
      notes: opt(formData, "notes"),
    },
  });

  revalidatePath(`/seat-workspaces/${seatWorkspaceId}`);
  redirect(`/seat-workspaces/${seatWorkspaceId}`);
}

export async function endSeatMembership(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const membership = await prisma.seatMembership.update({
    where: { id },
    data: { status: "ENDED", endDate: new Date() },
  });
  revalidatePath(`/seat-workspaces/${membership.seatWorkspaceId}`);
  redirect(`/seat-workspaces/${membership.seatWorkspaceId}`);
}
