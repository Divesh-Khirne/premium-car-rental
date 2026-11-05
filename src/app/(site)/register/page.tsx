import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Create account" };
export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Book in minutes and track every rental." footer={<>Already registered? <Link href="/login" className="font-semibold text-gold-dark hover:underline">Log in</Link></>}>
      <RegisterForm />
    </AuthShell>
  );
}
