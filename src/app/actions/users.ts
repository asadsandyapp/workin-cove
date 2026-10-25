"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createUser(formData: FormData) {
  const actor = await requireAdmin();
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const password = str(formData, "password");
  const role = str(formData, "role") === "ADMIN" ? "ADMIN" : "AGENT";

  if (!email || !name || password.length < 4) {
    throw new Error("Name, email, and password (min 4 chars) are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      status: "ACTIVE",
      passwordHash: await hashPassword(password),
    },
  });

  await logActivity({
    type: "USER_CREATED",
    summary: `User created: ${user.name} (${user.role})`,
    createdById: actor.id,
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUserStatus(formData: FormData) {
  const actor = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") === "DISABLED" ? "DISABLED" : "ACTIVE";
  if (!id || id === actor.id) {
    throw new Error("Cannot change your own status here");
  }
  await prisma.user.update({ where: { id }, data: { status } });
  revalidatePath("/users");
  redirect("/users");
}
