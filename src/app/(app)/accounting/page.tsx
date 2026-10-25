import { prisma } from "@/lib/db";
import { ensureChartOfAccounts, trialBalance } from "@/lib/accounting";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinor } from "@/lib/money";

export default async function AccountingPage() {
  await ensureChartOfAccounts();
  const [accounts, entries, tb] = await Promise.all([
    prisma.account.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.journalEntry.findMany({
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: "desc" },
      take: 30,
    }),
    trialBalance(),
  ]);

  const revenue = tb.rows
    .filter((r) => r.type === "REVENUE")
    .reduce((s, r) => s + (r.credit - r.debit), BigInt(0));
  const expense = tb.rows
    .filter((r) => r.type === "EXPENSE")
    .reduce((s, r) => s + (r.debit - r.credit), BigInt(0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting"
        description="Integer minor-unit ledger. Reports are authoritative only when trial balance reconciles."
      />
      <div className="flex flex-wrap gap-3">
        <Badge variant={tb.balanced ? "success" : "danger"}>
          Trial balance {tb.balanced ? "balanced" : "OUT OF BALANCE"}
        </Badge>
        <Badge variant="secondary">Debits {formatMinor(tb.totalDebit)}</Badge>
        <Badge variant="secondary">Credits {formatMinor(tb.totalCredit)}</Badge>
        <Badge variant="outline">P&L {formatMinor(revenue - expense)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chart of accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {accounts.map((a) => (
              <div key={a.id} className="flex justify-between border-b py-1">
                <span>
                  {a.code} · {a.name}
                </span>
                <span className="text-stone-500">{a.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trial balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tb.rows.map((r) => (
              <div key={r.code} className="grid grid-cols-3 gap-2 border-b py-1">
                <span>
                  {r.code} {r.name}
                </span>
                <span>{formatMinor(r.debit)}</span>
                <span>{formatMinor(r.credit)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent journal entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((e) => (
            <div key={e.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {e.memo || e.sourceType} · {e.entryDate.toLocaleDateString()}
              </p>
              <div className="mt-2 space-y-1 text-xs text-stone-600">
                {e.lines.map((l) => (
                  <div key={l.id} className="flex justify-between">
                    <span>
                      {l.account.code} {l.account.name}
                    </span>
                    <span>
                      Dr {formatMinor(l.debitMinor)} / Cr {formatMinor(l.creditMinor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
