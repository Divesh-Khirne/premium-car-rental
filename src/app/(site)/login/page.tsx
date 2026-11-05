import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Log in" };
const notices: Record<string, string> = { inactive: "This account is deactivated. Please contact support.", link: "That link is invalid or has expired. Please request a new one." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your bookings." footer={<>New here? <Link href="/register" className="font-semibold text-gold-dark hover:underline">Create an account</Link></>}>
      <LoginForm next={next} notice={error ? notices[error] : undefined} />
    </AuthShell>
  );
}
