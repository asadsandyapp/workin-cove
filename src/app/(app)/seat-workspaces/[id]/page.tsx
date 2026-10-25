import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMinor } from "@/lib/money";
import { fullName } from "@/lib/utils";
import { addSeatMembership, endSeatMembership } from "@/app/actions/seats";

export default async function SeatWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seat, contacts] = await Promise.all([
    prisma.seatWorkspace.findUnique({
      where: { id },
      include: {
        property: true,
        memberships: {
          orderBy: { startDate: "desc" },
          include: { contact: true },
        },
      },
    }),
    prisma.contact.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
  ]);
  if (!seat) notFound();

  const active = seat.memberships.filter((m) => m.status === "ACTIVE");
  const used = active.reduce((n, m) => n + m.seats, 0);
  const booked = active.reduce((n, m) => n + m.monthlyChargeMinor, BigInt(0));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Property · seat workspace"
        title={seat.name}
        description={
          seat.description ||
          "Paid desks charged per seat for office / developer work."
        }
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Seat workspaces", href: "/seat-workspaces" },
          { label: seat.name },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Occupancy</p>
          <p className="mt-1 text-2xl font-semibold">
            {used} / {seat.capacity}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Price per seat</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMinor(seat.pricePerSeatMinor)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Monthly booked</p>
          <p className="mt-1 text-2xl font-semibold">{formatMinor(booked)}</p>
        </div>
      </div>

      {seat.property ? (
        <p className="text-sm text-slate-600">
          Building:{" "}
          <Link href={`/properties/${seat.propertyId}`} className="text-teal-800 underline">
            {seat.property.name}
          </Link>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="data-table-wrap">
          <div className="border-b px-4 py-3 text-sm font-semibold">Members</div>
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Monthly</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {seat.memberships.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${m.contactId}`}
                      className="text-teal-900 hover:underline"
                    >
                      {fullName(m.contact.firstName, m.contact.lastName)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{m.seats}</td>
                  <td className="px-4 py-3">{formatMinor(m.monthlyChargeMinor)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status === "ACTIVE" ? "success" : "secondary"}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.status === "ACTIVE" ? (
                      <form action={endSeatMembership}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="outline" size="sm">
                          End
                        </Button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!seat.memberships.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No members yet — assign seats to a CRM contact.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <form action={addSeatMembership} className="space-y-3 rounded-lg border bg-white p-5">
          <h2 className="text-sm font-semibold">Assign seats</h2>
          <input type="hidden" name="seatWorkspaceId" value={seat.id} />
          <div className="space-y-1.5">
            <Label>Contact (person / company contact)</Label>
            <Select name="contactId" required defaultValue="">
              <option value="" disabled>
                Select contact
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c.firstName, c.lastName)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Number of seats</Label>
            <Input
              name="seats"
              type="number"
              min={1}
              max={seat.capacity - used}
              defaultValue={1}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input
              name="startDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly charge override (optional)</Label>
            <Input name="monthlyCharge" type="number" step="0.01" placeholder="Auto = seats × price" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea name="notes" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={used >= seat.capacity}>
            Assign seats
          </Button>
          {used >= seat.capacity ? (
            <p className="text-xs text-amber-700">This workspace is full.</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
