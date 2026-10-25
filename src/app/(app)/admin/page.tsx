import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function AdminHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "admin")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/users"
      firstActionLabel="Manage users"
      howToUse={[
        "Create Agent users so staff can log in and work leads assigned to them.",
        "Set company name, timezone (Asia/Karachi), and lead webhooks in Settings.",
        "CRM desks (old “workspaces”) are optional internal sales labels — not paid office seats.",
        "Paid per-seat desks live under Property → Seat workspaces.",
      ]}
    />
  );
}
