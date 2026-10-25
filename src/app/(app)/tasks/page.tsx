import Link from "next/link";
import { completeTask, rescheduleTask, createTask } from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { taskWhereForView, type TaskView } from "@/lib/tasks";
import { getBusinessTimezone } from "@/lib/timezone";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const VIEWS: { key: TaskView; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "next7", label: "Next 7 Days" },
  { key: "next30", label: "Next 30 Days" },
  { key: "open", label: "All Open" },
  { key: "completed", label: "Completed" },
  { key: "unscheduled", label: "Unscheduled" },
];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const view = (VIEWS.some((v) => v.key === params.view)
    ? params.view
    : "open") as TaskView;
  const where = await taskWhereForView(view);
  const tz = await getBusinessTimezone();
  const [tasks, workspaces, leads, contacts, deals] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        lead: true,
        contact: true,
        deal: true,
        workspace: true,
        reschedules: { orderBy: { createdAt: "desc" }, take: 3 },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.workspace.findMany({ orderBy: { name: "asc" } }),
    prisma.lead.findMany({ take: 50, orderBy: { firstName: "asc" } }),
    prisma.contact.findMany({ take: 50, orderBy: { firstName: "asc" } }),
    prisma.deal.findMany({ take: 50, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Tasks & follow-ups"
        description={`Work you must do: calls, meetings, emails, reminders. Views use business timezone (${tz}). Start with Overdue, then Today.`}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Tasks" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/tasks?view=${v.key}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              view === v.key ? "bg-teal-900 text-white" : "border bg-white"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-stone-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">{task.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {task.type} · {task.priority}
                    {task.dueAt ? ` · due ${task.dueAt.toLocaleString()}` : " · unscheduled"}
                    {task.workspace ? ` · ${task.workspace.name}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{task.status}</Badge>
                    {task.lead ? (
                      <Link href={`/leads/${task.lead.id}`}>
                        <Badge variant="outline">Lead</Badge>
                      </Link>
                    ) : null}
                    {task.contact ? (
                      <Link href={`/contacts/${task.contact.id}`}>
                        <Badge variant="outline">Contact</Badge>
                      </Link>
                    ) : null}
                    {task.deal ? (
                      <Link href={`/deals/${task.deal.id}`}>
                        <Badge variant="outline">Deal</Badge>
                      </Link>
                    ) : null}
                  </div>
                  {task.reschedules.length ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Reschedule history:{" "}
                      {task.reschedules
                        .map(
                          (r) =>
                            `${r.previousDue?.toLocaleDateString() || "none"} → ${r.newDue?.toLocaleDateString() || "none"}`,
                        )
                        .join("; ")}
                    </p>
                  ) : null}
                </div>
                {task.status === "OPEN" ? (
                  <div className="flex flex-col gap-2">
                    <form action={completeTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="outcome" value="Completed" />
                      <Button type="submit" size="sm">
                        Quick complete
                      </Button>
                    </form>
                    <form action={rescheduleTask} className="flex gap-1">
                      <input type="hidden" name="id" value={task.id} />
                      <Input
                        name="dueAt"
                        type="datetime-local"
                        className="h-8 w-44 text-xs"
                        required
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </form>
                  </div>
                ) : (
                  <Badge variant="success">{task.outcome || "Done"}</Badge>
                )}
              </div>
            </div>
          ))}
          {!tasks.length ? (
            <p className="rounded-lg border bg-white p-8 text-center text-sm text-stone-500">
              No tasks in this view.
            </p>
          ) : null}
        </div>

        <form action={createTask} className="h-fit space-y-3 rounded-lg border bg-white p-4">
          <p className="font-medium">New task</p>
          <Input name="title" placeholder="Title" required />
          <Textarea name="description" placeholder="Description" rows={2} />
          <Select name="type" defaultValue="FOLLOW_UP">
            {["CALL", "MEETING", "EMAIL", "FOLLOW_UP", "REMINDER", "TODO"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select name="priority" defaultValue="MEDIUM">
            {["LOW", "MEDIUM", "HIGH"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input name="dueAt" type="datetime-local" />
          <Select name="workspaceId" defaultValue="">
            <option value="">Workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Select name="leadId" defaultValue="">
            <option value="">Lead</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.firstName} {l.lastName || ""}
              </option>
            ))}
          </Select>
          <Select name="contactId" defaultValue="">
            <option value="">Contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName || ""}
              </option>
            ))}
          </Select>
          <Select name="dealId" defaultValue="">
            <option value="">Deal</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full">
            Create task
          </Button>
        </form>
      </div>
    </div>
  );
}
