import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();

  return (
    <SettingsClient
      initialName={admin.name}
      initialEmail={admin.email}
      initialRetentionDays={admin.retentionDays}
    />
  );
}
