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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(180,83,9,0.2),transparent_35%),linear-gradient(160deg,#0c1a17,#1c1917_55%,#292524)]" />
      <div className="relative w-full max-w-md animate-fade-up rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl">
        <p className="font-display text-3xl font-semibold tracking-tight text-teal-950">
          Workin Cove
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Sign in to the workspace CRM. Single-company Admin demo.
        </p>
        <LoginForm nextPath={params.next || "/"} error={params.error} />
        <p className="mt-6 text-xs text-stone-500">
          Demo: admin@workincove.local / 1122
        </p>
      </div>
    </div>
  );
}
