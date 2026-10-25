import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  {
    key: "properties",
    href: "/properties",
    title: "Property inventory",
    blurb: "Company-owned portfolio — separate from optional CRM teams.",
  },
  {
    key: "tenants",
    href: "/tenants",
    title: "Tenants & leases",
    blurb: "Tenants link to shared CRM contacts; leases and rent schedules live here.",
  },
  {
    key: "expenses",
    href: "/expenses",
    title: "Expenses & maintenance",
    blurb: "Operating costs and work orders linked to properties.",
  },
  {
    key: "transactions",
    href: "/transactions",
    title: "Sales & purchases",
    blurb: "Property sale/purchase milestones with CRM counterparties.",
  },
  {
    key: "accounting",
    href: "/accounting",
    title: "Accounting",
    blurb: "Chart of accounts, journals, and reconciliation with integer money.",
  },
];

export default async function ModulesPage() {
  const links = await prisma.moduleLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Specialized modules"
        description="CRM stays generic. Specialized operations connect through shared contacts, tasks, activities, and ModuleLink records."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => (
          <Link key={m.key} href={m.href}>
            <Card className="h-full transition hover:border-teal-700/40">
              <CardHeader>
                <CardTitle>{m.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">{m.blurb}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shared module links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {links.map((link) => (
            <div key={link.id} className="flex justify-between border-b py-2">
              <span>
                {link.moduleLabel} → {link.crmEntityType}:{link.crmEntityId}
              </span>
              <span className="text-stone-500">{link.externalRef || "—"}</span>
            </div>
          ))}
          {!links.length ? (
            <p className="text-stone-500">No cross-module links yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
