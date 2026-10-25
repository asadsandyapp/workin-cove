import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionPanel({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line-soft)] bg-[var(--surface-muted)]/70 px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[var(--ink)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{description}</p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function MeterRow({
  label,
  value,
  max,
  href,
  color = "#0f6f68",
}: {
  label: string;
  value: number;
  max: number;
  href: string;
  color?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <Link
      href={href}
      className="block space-y-1.5 rounded-lg px-1.5 py-2.5 transition hover:bg-[var(--surface-muted)]"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink-soft)]">{label}</span>
        <span className="font-semibold text-[var(--ink)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-md bg-[var(--line-soft)]">
        <div
          className="h-full rounded-md transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </Link>
  );
}
