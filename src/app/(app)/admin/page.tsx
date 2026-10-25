import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function AdminHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "admin")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/settings"
      firstActionLabel="Go to Settings"
      howToUse={[
        "Set company name, timezone (Asia/Karachi by default), and lead webhooks in Settings.",
        "Configure pipelines, tags, and custom fields under Settings tabs.",
        "Teams are optional desk labels for CRM — skip them if one person handles everything.",
        "Integrations map shows how Property/Finance screens share CRM people records.",
      ]}
    />
  );
}
