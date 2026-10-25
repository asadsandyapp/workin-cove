import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function PropertyHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "property")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/leases/new"
      firstActionLabel="New lease"
      howToUse={[
        "Add company-owned Properties first (inventory).",
        "Use New lease — one form creates the person, tenant, and lease together (no Contact → Tenant → Lease chain).",
        "Open the lease to generate the first rent invoice, then collect payments there.",
        "Partial payments stay PARTIAL until the invoice balance is zero.",
      ]}
    />
  );
}
