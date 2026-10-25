import { notFound } from "next/navigation";
import {
  collectRentAction,
  escalateRentAction,
  generateInvoiceAction,
} from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMinor, fromMinor } from "@/lib/money";
import { fullName } from "@/lib/utils";

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      property: true,
      tenant: { include: { contact: true } },
      escalations: { orderBy: { effectiveDate: "desc" } },
      invoices: {
        include: { payments: { orderBy: { paidAt: "desc" } } },
        orderBy: { dueDate: "desc" },
      },
    },
  });
  if (!lease) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={lease.property.name}
        description={`Lease for ${fullName(lease.tenant.contact.firstName, lease.tenant.contact.lastName)}`}
      />
      <div className="flex flex-wrap gap-2">
        <Badge>{lease.status}</Badge>
        <Badge variant="secondary">
          Rent {formatMinor(lease.rentAmountMinor, lease.currency)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate rent invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={generateInvoiceAction} className="flex gap-2">
              <input type="hidden" name="leaseId" value={lease.id} />
              <Input name="periodStart" type="month" required />
              <Button type="submit">Generate</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Escalate rent</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={escalateRentAction} className="grid gap-2 sm:grid-cols-3">
              <input type="hidden" name="leaseId" value={lease.id} />
              <Input name="effectiveDate" type="date" required />
              <Input
                name="percent"
                type="number"
                step="0.01"
                defaultValue={lease.escalationPercent}
              />
              <Button type="submit">Apply</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices & collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lease.invoices.map((inv) => (
            <div key={inv.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {inv.periodStart.toLocaleDateString()} –{" "}
                    {inv.periodEnd.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-stone-500">
                    Amount {formatMinor(inv.amountMinor)} · Balance{" "}
                    {formatMinor(inv.balanceMinor)} · Due{" "}
                    {inv.dueDate.toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={
                    inv.status === "PAID"
                      ? "success"
                      : inv.status === "PARTIAL"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {inv.status}
                </Badge>
              </div>
              {inv.balanceMinor > BigInt(0) ? (
                <form action={collectRentAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="invoiceId" value={inv.id} />
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={fromMinor(inv.balanceMinor)}
                    className="w-36"
                  />
                  <Input name="reference" placeholder="Reference" className="w-40" />
                  <Button type="submit" size="sm">
                    Collect
                  </Button>
                </form>
              ) : null}
              <div className="mt-2 space-y-1 text-xs text-stone-500">
                {inv.payments.map((p) => (
                  <div key={p.id}>
                    Paid {formatMinor(p.amountMinor)} on {p.paidAt.toLocaleString()}
                    {p.isReversal ? " (reversal)" : ""}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!lease.invoices.length ? (
            <p className="text-sm text-stone-500">No invoices yet.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {lease.escalations.map((e) => (
            <div key={e.id}>
              {e.effectiveDate.toLocaleDateString()}: {formatMinor(e.previousRentMinor)} →{" "}
              {formatMinor(e.newRentMinor)} ({e.percent}%)
            </div>
          ))}
          {!lease.escalations.length ? (
            <p className="text-stone-500">No escalations.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
