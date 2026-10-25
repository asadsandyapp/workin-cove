import Link from "next/link";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  href: string;
  tone?: "default" | "warning" | "success" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200/80 bg-amber-50/70"
      : tone === "success"
        ? "border-emerald-200/80 bg-emerald-50/60"
        : tone === "danger"
          ? "border-red-200/80 bg-red-50/70"
          : "border-[var(--line-soft)] bg-white";

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-[14px] border p-5 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)]/30",
        toneClass,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-2.5 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{hint}</p> : null}
    </Link>
  );
}
