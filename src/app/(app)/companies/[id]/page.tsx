import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline } from "@/components/activity-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fullName } from "@/lib/utils";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: true,
      deals: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      workspace: true,
    },
  });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={company.name} description={company.industry || "Company"} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {company.contacts.map((c) => (
              <Link key={c.id} href={`/contacts/${c.id}`} className="block text-sm hover:underline">
                {fullName(c.firstName, c.lastName)}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {company.deals.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block text-sm hover:underline">
                {d.title}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline items={company.activities} />
        </CardContent>
      </Card>
    </div>
  );
}
