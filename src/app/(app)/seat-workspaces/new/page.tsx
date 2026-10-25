import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSeatWorkspace } from "@/app/actions/seats";

export default async function NewSeatWorkspacePage() {
  await requireAdmin();
  const properties = await prisma.property.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow="Property"
        title="New seat workspace"
        description="A room or floor of paid desks. Set capacity and monthly price per seat."
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Seat workspaces", href: "/seat-workspaces" },
          { label: "New" },
        ]}
      />
      <form action={createSeatWorkspace} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. Open desk floor — Block A"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Code (optional)</Label>
          <Input id="code" name="code" placeholder="A-OPEN" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="propertyId">Building / property</Label>
          <Select id="propertyId" name="propertyId" defaultValue="">
            <option value="">None yet</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Total seats</Label>
            <Input id="capacity" name="capacity" type="number" min={1} required defaultValue={20} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pricePerSeat">Price per seat / month</Label>
            <Input
              id="pricePerSeat"
              name="pricePerSeat"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="25000"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Who is this for?</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Developers, freelancers, small teams needing desks"
          />
        </div>
        <Button type="submit">Create seat workspace</Button>
      </form>
    </div>
  );
}
