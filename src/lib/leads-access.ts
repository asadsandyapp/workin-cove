import { isAdmin, type AppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Agents only see leads assigned to them, or the unassigned pool. */
export function leadScopeWhere(user: AppUser, mineOnly = false) {
  if (isAdmin(user) && !mineOnly) return {};
  if (isAdmin(user) && mineOnly) return { assigneeId: user.id };
  return {
    OR: [{ assigneeId: user.id }, { assigneeId: null }],
  };
}

export async function assertCanAccessLead(user: AppUser, leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return null;
  if (isAdmin(user)) return lead;
  if (lead.assigneeId === user.id || lead.assigneeId === null) return lead;
  return null;
}
