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
      ? "border-amber-200 bg-amber-50/60"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50/50"
        : tone === "danger"
          ? "border-red-200 bg-red-50/60"
          : "border-slate-200 bg-white";

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        toneClass,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-slate-600">{hint}</p> : null}
    </Link>
  );
}
