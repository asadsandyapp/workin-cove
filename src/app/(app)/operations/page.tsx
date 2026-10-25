import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function OperationsHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "operations")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/expenses"
      firstActionLabel="Go to Expenses"
      howToUse={[
        "Record Expenses for repairs, utilities, and vendors (posts to accounting).",
        "Create Maintenance work orders against a property.",
        "Use Buy / sell property for asset purchases or sales — keep status Draft until complete.",
      ]}
    />
  );
}
