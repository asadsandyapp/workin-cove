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
    <div className="mb-6 space-y-3 border-b border-slate-200 pb-5">
      {breadcrumbs?.length ? (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span>/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-teal-800">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
