import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUser, updateUserStatus } from "@/app/actions/users";

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { assignedLeads: true, assignedTasks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Staff who log in to Workin Cove. Admins manage the company; Agents work leads assigned to them — like a normal enterprise CRM."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users" },
        ]}
      />

      <section className="rounded-lg border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950">
        <p className="font-medium">How assignment works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Create an Agent user here and give them a password.</li>
          <li>On a Lead, set Owner to that agent (or leave unassigned for the pool).</li>
          <li>The agent signs in and sees My leads / unassigned leads to work.</li>
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">{u._count.assignedLeads}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === "ACTIVE" ? "success" : "secondary"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={updateUserStatus} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={u.status === "ACTIVE" ? "DISABLED" : "ACTIVE"}
                      />
                      <Button type="submit" variant="outline" size="sm">
                        {u.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={createUser} className="space-y-3 rounded-lg border bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Add user</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Sara Khan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Login email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="password" required minLength={4} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="AGENT">
              <option value="AGENT">Agent — works assigned leads</option>
              <option value="ADMIN">Admin — full access</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Create user
          </Button>
        </form>
      </div>
    </div>
  );
}
