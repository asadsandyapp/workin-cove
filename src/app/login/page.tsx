import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  if (user) redirect(params.next || "/");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(15,111,104,0.35),transparent_42%),radial-gradient(ellipse_at_85%_10%,rgba(12,31,36,0.55),transparent_40%),linear-gradient(165deg,#052022,#0c1f24_50%,#14363a)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/15 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Workin Cove
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[var(--ink)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
          Admin sees everything. Agents only see leads assigned to them.
        </p>
        <LoginForm nextPath={params.next || "/"} error={params.error} />
        <p className="mt-6 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--ink-soft)]">
          Demo admin: <span className="font-medium text-[var(--ink)]">admin@workincove.local</span> /{" "}
          <span className="font-medium text-[var(--ink)]">1122</span>
        </p>
      </div>
    </div>
  );
}
