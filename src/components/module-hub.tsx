import Link from "next/link";
import type { NavGroup } from "@/lib/nav";
import { PageHeader } from "@/components/page-header";

export function ModuleHub({
  group,
  howToUse,
  firstActionHref,
  firstActionLabel,
}: {
  group: NavGroup;
  howToUse: string[];
  firstActionHref: string;
  firstActionLabel: string;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Module overview"
        title={group.label}
        description={group.blurb}
        actionHref={firstActionHref}
        actionLabel={firstActionLabel}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: group.label },
        ]}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          How to use this module
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {howToUse.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Open a screen
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-teal-700/40 hover:shadow-sm"
            >
              <p className="font-medium text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm text-slate-600">{item.blurb}</p>
              <p className="mt-3 text-xs font-medium text-teal-800">Open →</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
