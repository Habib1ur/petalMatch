import { AdminShell } from "@/components/dashboard/AdminShell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name} adminEmail={admin.email}>
      {children}
    </AdminShell>
  );
}
