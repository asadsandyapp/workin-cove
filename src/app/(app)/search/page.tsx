import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { fullName } from "@/lib/utils";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const [leads, contacts, companies, deals, properties] = query
    ? await Promise.all([
        prisma.lead.findMany({
          where: {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
              { companyName: { contains: query } },
            ],
          },
          take: 20,
        }),
        prisma.contact.findMany({
          where: {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
            ],
          },
          take: 20,
        }),
        prisma.company.findMany({
          where: { name: { contains: query } },
          take: 20,
        }),
        prisma.deal.findMany({
          where: { title: { contains: query } },
          take: 20,
        }),
        prisma.property.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { addressLine1: { contains: query } },
              { code: { contains: query } },
            ],
          },
          take: 20,
        }),
      ])
    : [[], [], [], [], []];

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Find CRM and property records." />
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search…"
          className="h-10 w-full max-w-lg rounded-md border px-3"
        />
        <button className="h-10 rounded-md bg-teal-900 px-4 text-white" type="submit">
          Search
        </button>
      </form>
      {query ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ResultGroup
            title="Leads"
            items={leads.map((l) => ({
              href: `/leads/${l.id}`,
              label: fullName(l.firstName, l.lastName),
            }))}
          />
          <ResultGroup
            title="Contacts"
            items={contacts.map((c) => ({
              href: `/contacts/${c.id}`,
              label: fullName(c.firstName, c.lastName),
            }))}
          />
          <ResultGroup
            title="Companies"
            items={companies.map((c) => ({ href: `/companies/${c.id}`, label: c.name }))}
          />
          <ResultGroup
            title="Deals"
            items={deals.map((d) => ({ href: `/deals/${d.id}`, label: d.title }))}
          />
          <ResultGroup
            title="Properties"
            items={properties.map((p) => ({
              href: `/properties/${p.id}`,
              label: p.name,
            }))}
          />
        </div>
      ) : (
        <p className="text-sm text-stone-500">Enter a query to search.</p>
      )}
    </div>
  );
}

function ResultGroup({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="mb-2 font-medium">{title}</p>
      <div className="space-y-1 text-sm">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block text-teal-900 hover:underline">
            {item.label}
          </Link>
        ))}
        {!items.length ? <p className="text-stone-500">No matches.</p> : null}
      </div>
    </div>
  );
}
