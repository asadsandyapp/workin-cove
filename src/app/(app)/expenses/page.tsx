import { createExpense } from "@/app/actions/operations";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMinor } from "@/lib/money";

export default async function ExpensesPage() {
  const [expenses, categories, vendors, properties] = await Promise.all([
    prisma.expense.findMany({
      where: { archivedAt: null },
      include: { category: true, vendor: true, property: true },
      orderBy: { incurredOn: "desc" },
      take: 100,
    }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.property.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Operating costs posted to the ledger without double-counting."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="data-table-wrap">
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3">Expense</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-stone-500">
                      {e.category?.name || "Uncategorized"}
                      {e.vendor ? ` · ${e.vendor.name}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{e.property?.name || "—"}</td>
                  <td className="px-4 py-3">{formatMinor(e.amountMinor)}</td>
                  <td className="px-4 py-3">{e.incurredOn.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={createExpense} className="h-fit space-y-3 rounded-lg border bg-white p-4">
          <p className="font-medium">Record expense</p>
          <Input name="title" placeholder="Title" required />
          <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
          <Input name="incurredOn" type="date" />
          <Select name="categoryId" defaultValue="">
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
          <Select name="propertyId" defaultValue="">
            <option value="">Property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isRecurring" /> Recurring
          </label>
          <Button type="submit" className="w-full">
            Save & post
          </Button>
        </form>
      </div>
    </div>
  );
}
