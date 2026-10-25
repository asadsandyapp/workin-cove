import { NAV_GROUPS } from "@/lib/nav";
import { ModuleHub } from "@/components/module-hub";

export default function FinanceHubPage() {
  const group = NAV_GROUPS.find((g) => g.id === "finance")!;
  return (
    <ModuleHub
      group={group}
      firstActionHref="/accounting"
      firstActionLabel="Go to Accounting"
      howToUse={[
        "Open Accounting to see chart of accounts and journal entries.",
        "Trial balance must stay Balanced after rent, expenses, and property postings.",
        "Money is stored as exact integer amounts (no floating-point books).",
      ]}
    />
  );
}
