import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function CrmHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "crm")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/leads"
      firstActionLabel="Go to Leads"
      howToUse={[
        "Admin creates Users (Agents), then assigns each Lead an Owner.",
        "Agents log in and work their assigned leads (plus the unassigned pool).",
        "Convert a qualified lead into a Contact (and optionally a Deal).",
        "Move Deals across pipeline stages until Won or Lost.",
        "Paid office seats are under Property → Seat workspaces — not here.",
      ]}
    />
  );
}
