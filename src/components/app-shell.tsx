"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  CheckSquare,
  ContactRound,
  FileBarChart2,
  Handshake,
  Home,
  Search,
  Settings,
  Tags,
  Users,
  Wrench,
  Workflow,
} from "lucide-react";
import { NAV_GROUPS, TOP_NAV, findGroupForPath } from "@/lib/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": Home,
  "/reports": FileBarChart2,
  "/workspaces": Building2,
  "/seat-workspaces": Building2,
  "/users": Users,
  "/leads": Users,
  "/contacts": ContactRound,
  "/companies": Handshake,
  "/deals": Workflow,
  "/tasks": CheckSquare,
  "/search": Search,
  "/properties": Building2,
  "/tenants": Users,
  "/leases": Handshake,
  "/expenses": Tags,
  "/maintenance": Wrench,
  "/transactions": Workflow,
  "/accounting": Calculator,
  "/settings": Settings,
  "/modules": Workflow,
  "/crm": Users,
  "/property": Building2,
  "/operations": Wrench,
  "/finance": Calculator,
  "/admin": Settings,
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  companyName,
  userName,
  userRole = "ADMIN",
  isAdmin = true,
}: {
  children: React.ReactNode;
  companyName: string;
  userName: string;
  userRole?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const activeGroup = findGroupForPath(pathname);
  const navGroups = isAdmin
    ? NAV_GROUPS
    : NAV_GROUPS.filter((g) => g.id === "crm" || g.id === "property");

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-slate-800 bg-[#0b1220] text-slate-200 lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-lg font-semibold tracking-tight text-white">
              {companyName}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Business management · single company
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Start here
            </p>
            <div className="mb-5 space-y-0.5">
              {TOP_NAV.map((item) => {
                const Icon = ICONS[item.href] || Home;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 rounded-md px-2.5 py-2 transition",
                      active
                        ? "bg-teal-600 text-white"
                        : "hover:bg-white/5",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span
                        className={cn(
                          "block text-[11px] leading-snug",
                          active ? "text-teal-50/90" : "text-slate-500",
                        )}
                      >
                        {item.blurb}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>

            {navGroups.map((group) => {
              const groupActive = activeGroup?.id === group.id;
              return (
                <div key={group.id} className="mb-5">
                  <Link
                    href={group.href}
                    className={cn(
                      "mb-1 flex items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                      groupActive
                        ? "bg-white/10 text-teal-300"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                    )}
                  >
                    <span>{group.label}</span>
                    <span className="normal-case tracking-normal text-[10px] font-normal text-slate-500">
                      overview
                    </span>
                  </Link>
                  <div className="space-y-0.5 border-l border-white/10 ml-3 pl-2">
                    {group.items.map((item) => {
                      const Icon = ICONS[item.href] || Home;
                      const active = isActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.blurb}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition",
                            active
                              ? "bg-teal-600 font-medium text-white"
                              : "text-slate-300 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 px-4 py-4 text-xs text-slate-400">
            <p className="font-medium text-slate-200">{userName}</p>
            <p className="mt-0.5">{userRole === "ADMIN" ? "Admin" : "Sales agent"}</p>
            <form action="/api/auth/logout" method="post" className="mt-3">
              <button type="submit" className="text-teal-300 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-8">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900 lg:hidden">
                  {companyName}
                </p>
                <p className="hidden text-sm text-slate-600 lg:block">
                  {activeGroup
                    ? `${activeGroup.label}: ${activeGroup.blurb}`
                    : "Choose a module from the left. Each group has an Overview page that explains what to do."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/search"
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Search
                </Link>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {userName}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
              {[...TOP_NAV, ...navGroups.flatMap((g) => [ { href: g.href, label: g.label, blurb: g.blurb }, ...g.items ])].map(
                (item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs",
                      isActive(pathname, item.href)
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </header>
          <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
