import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";

export default async function TransactionsPage() {
  const txs = await prisma.propertyTransaction.findMany({
    where: { archivedAt: null },
    include: { property: true, counterpartyContact: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader
        title="Sales & purchases"
        description="Property transactions with CRM counterparties. Status stays draft until conditions are met."
        actionHref="/transactions/new"
        actionLabel="New transaction"
      />
      <div className="data-table-wrap">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/transactions/${t.id}`} className="text-teal-900 hover:underline">
                    {t.type}
                  </Link>
                </td>
                <td className="px-4 py-3">{t.property.name}</td>
                <td className="px-4 py-3">{formatMinor(t.agreedAmountMinor)}</td>
                <td className="px-4 py-3">
                  <Badge>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
