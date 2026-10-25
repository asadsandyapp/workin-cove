"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckSquare,
  ContactRound,
  Gauge,
  Handshake,
  LayoutDashboard,
  Puzzle,
  Settings,
  Tags,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/companies", label: "Companies", icon: Handshake },
  { href: "/deals", label: "Deals", icon: Workflow },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/leases", label: "Leases", icon: Handshake },
  { href: "/expenses", label: "Expenses", icon: Tags },
  { href: "/maintenance", label: "Maintenance", icon: CheckSquare },
  { href: "/transactions", label: "Sales/Purchases", icon: Workflow },
  { href: "/accounting", label: "Accounting", icon: Gauge },
  { href: "/modules", label: "Modules", icon: Puzzle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  companyName,
  userName,
}: {
  children: React.ReactNode;
  companyName: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f5f5f4_45%,_#fafaf9_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 border-r border-stone-200/80 bg-white/70 p-4 backdrop-blur md:block">
          <div className="mb-8 px-2">
            <p className="font-display text-xl font-semibold tracking-tight text-teal-950">
              {companyName}
            </p>
            <p className="mt-1 text-xs text-stone-500">Workspace CRM</p>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-teal-900 text-white"
                      : "text-stone-700 hover:bg-stone-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            <div className="flex items-center gap-2 font-medium text-stone-800">
              <Tags className="h-3.5 w-3.5" />
              Signed in
            </div>
            <p className="mt-1">{userName}</p>
            <form action="/api/auth/logout" method="post" className="mt-3">
              <button
                type="submit"
                className="text-teal-800 underline-offset-2 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-stone-200/80 bg-white/60 px-4 py-3 backdrop-blur md:hidden">
            <p className="font-display text-lg font-semibold text-teal-950">
              {companyName}
            </p>
            <Gauge className="h-5 w-5 text-teal-800" />
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-stone-200 bg-white/70 px-3 py-2 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs",
                  pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                    ? "bg-teal-900 text-white"
                    : "bg-stone-100 text-stone-700",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
