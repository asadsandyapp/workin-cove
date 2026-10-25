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
        eyebrow="Module guide"
        title={group.label}
        description={group.blurb}
        actionHref={firstActionHref}
        actionLabel={firstActionLabel}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: group.label },
        ]}
      />

      <section className="surface-card animate-fade-up p-6 sm:p-7">
        <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
          How to use this module
        </h2>
        <ol className="mt-4 space-y-3">
          {howToUse.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-[var(--ink-soft)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-strong)]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="animate-fade-up-delay">
        <h2 className="mb-3 font-display text-lg font-semibold text-[var(--ink)]">
          Open a screen
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-card group p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]/35"
            >
              <p className="font-semibold text-[var(--ink)]">{item.label}</p>
              <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{item.blurb}</p>
              <p className="mt-4 text-xs font-semibold text-[var(--brand)] group-hover:underline">
                Open →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
