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
        "Start with Leads for new inquiries (manual, import, or ads).",
        "Convert a qualified lead into a Contact (and optionally a Deal).",
        "Move Deals across pipeline stages until Won or Lost.",
        "Use Tasks for calls/meetings so nothing is missed.",
        "Use Workspaces only to filter work by team/office — they are not properties.",
      ]}
    />
  );
}
