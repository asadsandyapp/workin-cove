import { createWorkOrder } from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMinor } from "@/lib/money";

export default async function MaintenancePage() {
  const [orders, properties, vendors] = await Promise.all([
    prisma.workOrder.findMany({
      include: { property: true, vendor: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" description="Work orders linked to properties and leases." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-white p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-medium">{o.title}</p>
                  <p className="text-xs text-stone-500">
                    {o.property?.name || "No property"} · {o.vendor?.name || "No vendor"}
                  </p>
                </div>
                <Badge>{o.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-stone-600">{o.description}</p>
              <p className="mt-1 text-xs text-stone-500">
                Cost {formatMinor(o.costMinor)} · Priority {o.priority}
              </p>
            </div>
          ))}
        </div>
        <form action={createWorkOrder} className="h-fit space-y-3 rounded-lg border bg-white p-4">
          <p className="font-medium">New work order</p>
          <Input name="title" required placeholder="Title" />
          <Textarea name="description" rows={3} />
          <Select name="propertyId" defaultValue="">
            <option value="">Property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select name="vendorId" defaultValue="">
            <option value="">Vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
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
          <Input name="cost" type="number" step="0.01" placeholder="Est. cost" />
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </div>
    </div>
  );
}
