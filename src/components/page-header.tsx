import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  eyebrow,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-7 space-y-3 animate-fade-up">
      {breadcrumbs?.length ? (
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-soft)]">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <span className="text-[var(--line)]">/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[var(--brand)]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--ink)]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 border-b border-[var(--line-soft)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-[2.15rem] md:leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
              {description}
            </p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Button asChild size="lg">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
