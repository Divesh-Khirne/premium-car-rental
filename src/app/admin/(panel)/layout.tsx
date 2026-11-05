import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" } };

/** Server-side gate: every admin page re-verifies the admin role from the database. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="min-h-screen bg-surface">
      <AdminNav name={profile.full_name || profile.email} />
      <div className="lg:pl-64"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div></div>
    </div>
  );
}
