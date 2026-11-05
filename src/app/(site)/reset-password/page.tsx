import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "@/components/AuthForms";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password" };
export default async function ResetPage() {
  const { user } = await getSession(); // the email link signs the visitor in temporarily via /auth/callback
  return (
    <AuthShell title="Choose a new password">
      {user ? <ResetForm /> : <p className="text-sm text-slate-600">This reset link is invalid or has expired. <Link href="/forgot-password" className="font-semibold text-gold-dark hover:underline">Request a new link</Link>.</p>}
    </AuthShell>
  );
}
