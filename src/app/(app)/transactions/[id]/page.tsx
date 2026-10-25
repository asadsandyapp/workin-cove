import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinor } from "@/lib/money";
import { fullName } from "@/lib/utils";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tx = await prisma.propertyTransaction.findUnique({
    where: { id },
    include: { property: true, counterpartyContact: true, journalEntry: { include: { lines: true } } },
  });
  if (!tx) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title={`${tx.type} · ${tx.property.name}`} />
      <Badge>{tx.status}</Badge>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Agreed: {formatMinor(tx.agreedAmountMinor)}</p>
          <p>Fees: {formatMinor(tx.feesMinor)}</p>
          <p>Taxes: {formatMinor(tx.taxesMinor)}</p>
          <p>
            Counterparty:{" "}
            {tx.counterpartyContact ? (
              <Link
                href={`/contacts/${tx.counterpartyContact.id}`}
                className="text-teal-800 underline"
              >
                {fullName(
                  tx.counterpartyContact.firstName,
                  tx.counterpartyContact.lastName,
                )}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p>Closing: {tx.closingDate?.toLocaleDateString() || "—"}</p>
          <p>{tx.notes}</p>
        </CardContent>
      </Card>
    </div>
  );
}
