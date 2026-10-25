"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calculator,
  CheckSquare,
  ChevronDown,
  ContactRound,
  FileBarChart2,
  Gauge,
  Handshake,
  LayoutDashboard,
  Puzzle,
  Search,
  Settings,
  Tags,
  Users,
  Wrench,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const TOP_ITEMS: NavItem[] = [
  { href: "/", label: "Executive dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: FileBarChart2 },
];

const NAV_GROUPS: NavGroup[] = [
  {
    id: "crm",
    label: "CRM",
    items: [
      { href: "/workspaces", label: "Workspaces", icon: Building2 },
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/contacts", label: "Contacts", icon: ContactRound },
      { href: "/companies", label: "Companies", icon: Handshake },
      { href: "/deals", label: "Deals & pipeline", icon: Workflow },
      { href: "/tasks", label: "Tasks & follow-ups", icon: CheckSquare },
      { href: "/search", label: "Global search", icon: Search },
    ],
  },
  {
    id: "property",
    label: "Property & rental",
    items: [
      { href: "/properties", label: "Property inventory", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/leases", label: "Leases & rent", icon: Handshake },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/expenses", label: "Expenses", icon: Tags },
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/transactions", label: "Sales & purchases", icon: Workflow },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [{ href: "/accounting", label: "Accounting & ledger", icon: Calculator }],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/modules", label: "Module links", icon: Puzzle },
    ],
  },
];

function pathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => pathActive(pathname, item.href));
}

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
  const initialOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      open[group.id] = groupContainsPath(group, pathname);
    }
    if (!Object.values(open).some(Boolean)) open.crm = true;
    return open;
  }, [pathname]);
  const [openGroups, setOpenGroups] = useState(initialOpen);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (groupContainsPath(group, pathname)) next[group.id] = true;
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7f8_0%,#eef2f4_40%,#f8fafb_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 md:flex md:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="font-display text-xl font-semibold tracking-tight text-white">
              {companyName}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-teal-300/90">
              Enterprise operations
            </p>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {TOP_ITEMS.map((item) => {
                const active = pathActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {NAV_GROUPS.map((group) => {
              const open = openGroups[group.id];
              const sectionActive = groupContainsPath(group, pathname);
              return (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      sectionActive ? "text-teal-300" : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        open ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const active = pathActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                              active
                                ? "bg-teal-600 text-white"
                                : "text-slate-300 hover:bg-white/5 hover:text-white",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 opacity-80" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-medium text-slate-200">
              <Gauge className="h-3.5 w-3.5 text-teal-300" />
              {userName}
            </div>
            <p className="mt-1">Administrator</p>
            <form action="/api/auth/logout" method="post" className="mt-3">
              <button
                type="submit"
                className="text-teal-300 underline-offset-2 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 md:px-8">
              <div>
                <p className="font-display text-lg font-semibold text-slate-900 md:hidden">
                  {companyName}
                </p>
                <p className="hidden text-xs uppercase tracking-[0.14em] text-slate-500 md:block">
                  Workin Cove control center
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                  Live data
                </span>
                <span className="hidden sm:inline">{userName}</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden">
              {[...TOP_ITEMS, ...NAV_GROUPS.flatMap((g) => g.items)].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs",
                    pathActive(pathname, item.href)
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
