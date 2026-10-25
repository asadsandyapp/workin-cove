import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <AppShell
      companyName={settings?.companyName ?? "Workin Cove"}
      userName={user.name}
    >
      {children}
    </AppShell>
  );
}
