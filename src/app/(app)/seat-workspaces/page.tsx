import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";

export default async function SeatWorkspacesPage() {
  const seats = await prisma.seatWorkspace.findMany({
    orderBy: { name: "asc" },
    include: {
      property: true,
      memberships: { where: { status: "ACTIVE" } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Property"
        title="Seat workspaces"
        description="Places where people pay per seat to do office or development work. This is the real “workspace” product — not CRM teams."
        actionHref="/seat-workspaces/new"
        actionLabel="New seat workspace"
        breadcrumbs={[
          { label: "Property", href: "/property" },
          { label: "Seat workspaces" },
        ]}
      />

      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Full-unit rental leases stay under{" "}
        <Link href="/leases" className="font-medium underline">
          Leases & rent
        </Link>
        . Use seat workspaces when you sell desks by the seat.
      </div>

      <div className="data-table-wrap">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Workspace</th>
              <th className="px-4 py-3">Building</th>
              <th className="px-4 py-3">Seats used</th>
              <th className="px-4 py-3">Price / seat</th>
              <th className="px-4 py-3">Monthly booked</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {seats.map((s) => {
              const used = s.memberships.reduce((n, m) => n + m.seats, 0);
              const booked = s.memberships.reduce(
                (n, m) => n + m.monthlyChargeMinor,
                BigInt(0),
              );
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      href={`/seat-workspaces/${s.id}`}
                      className="font-medium text-teal-900 hover:underline"
                    >
                      {s.name}
                    </Link>
                    {s.description ? (
                      <p className="text-xs text-slate-500">{s.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{s.property?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {used} / {s.capacity}
                  </td>
                  <td className="px-4 py-3">{formatMinor(s.pricePerSeatMinor)}</td>
                  <td className="px-4 py-3">{formatMinor(booked)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{s.status}</Badge>
                  </td>
                </tr>
              );
            })}
            {!seats.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No seat workspaces yet. Create one to start charging per desk.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
