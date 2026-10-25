import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function PropertyHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "property")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/properties"
      firstActionLabel="Go to Properties"
      howToUse={[
        "Add company-owned Properties first (inventory).",
        "Create a Tenant from an existing CRM Contact.",
        "Create a Lease linking a property + tenant, then generate rent invoices.",
        "Collect rent in Leases — partial payments stay PARTIAL until balance is zero.",
      ]}
    />
  );
}
