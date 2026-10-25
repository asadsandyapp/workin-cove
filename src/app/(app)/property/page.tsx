import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function PropertyHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "property")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/seat-workspaces"
      firstActionLabel="Seat workspaces"
      howToUse={[
        "Add company-owned Properties (buildings) first.",
        "Seat workspaces = paid desks charged per seat for office / developer work — this is the real workspace product.",
        "Full-unit rentals: use New lease (creates person + tenant + lease in one step).",
        "Open a lease to invoice and collect rent; seat members show monthly booked revenue on the seat workspace.",
      ]}
    />
  );
}
