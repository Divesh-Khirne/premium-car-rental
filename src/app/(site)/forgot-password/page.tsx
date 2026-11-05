import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPage() {
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send you a link." footer={<Link href="/login" className="font-semibold text-gold-dark hover:underline">Back to log in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
