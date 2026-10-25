export type NavItem = {
  href: string;
  label: string;
  blurb: string;
};

export type NavGroup = {
  id: string;
  label: string;
  href: string;
  blurb: string;
  items: NavItem[];
};

export const TOP_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    blurb: "What needs attention right now",
  },
  {
    href: "/reports",
    label: "Reports",
    blurb: "Charts and breakdowns across the business",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "crm",
    label: "CRM",
    href: "/crm",
    blurb: "Find, track, and close customer relationships",
    items: [
      {
        href: "/leads",
        label: "Leads",
        blurb: "New inquiries before they become customers",
      },
      {
        href: "/contacts",
        label: "Contacts",
        blurb: "People you sell to or support",
      },
      {
        href: "/companies",
        label: "Companies",
        blurb: "Organizations linked to contacts and deals",
      },
      {
        href: "/deals",
        label: "Deals",
        blurb: "Sales opportunities moving through stages",
      },
      {
        href: "/tasks",
        label: "Tasks",
        blurb: "Calls, meetings, and follow-ups you must do",
      },
      {
        href: "/search",
        label: "Search",
        blurb: "Find any CRM or property record quickly",
      },
    ],
  },
  {
    id: "property",
    label: "Property",
    href: "/property",
    blurb: "Company-owned assets, tenants, and rent",
    items: [
      {
        href: "/properties",
        label: "Properties",
        blurb: "Buildings / units you own (not CRM workspaces)",
      },
      {
        href: "/tenants",
        label: "Tenants",
        blurb: "Renters (usually created via New lease)",
      },
      {
        href: "/leases",
        label: "Leases & rent",
        blurb: "Start here: one form for person + contract + rent",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    href: "/operations",
    blurb: "Day-to-day costs, maintenance, and transactions",
    items: [
      {
        href: "/expenses",
        label: "Expenses",
        blurb: "Operating costs posted to the ledger",
      },
      {
        href: "/maintenance",
        label: "Maintenance",
        blurb: "Work orders for properties",
      },
      {
        href: "/transactions",
        label: "Buy / sell property",
        blurb: "Purchase and sale deals for assets",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    href: "/finance",
    blurb: "Books, journals, and reconciliation",
    items: [
      {
        href: "/accounting",
        label: "Accounting",
        blurb: "Chart of accounts, journals, trial balance",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    blurb: "Company setup and integrations",
    items: [
      {
        href: "/settings",
        label: "Settings",
        blurb: "Timezone, pipelines, tags, webhooks",
      },
      {
        href: "/workspaces",
        label: "Teams (optional)",
        blurb: "Skip unless you split CRM work across desks",
      },
      {
        href: "/modules",
        label: "Integrations map",
        blurb: "How specialized modules link to CRM",
      },
    ],
  },
];

export function findGroupForPath(pathname: string) {
  return NAV_GROUPS.find(
    (group) =>
      pathname === group.href ||
      pathname.startsWith(`${group.href}/`) ||
      group.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      ),
  );
}
