import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/AuthForms";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const { profile } = await getSession();
  if (profile?.role === "admin" && profile.is_active) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo light /></div>
        <div className="rounded-2xl bg-white p-7 shadow-lift sm:p-9">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-gold"><ShieldCheck size={20} /></span><h1 className="text-2xl">Administrator sign in</h1></div>
          <p className="mt-2 text-sm text-slate-600">Staff accounts only. Admin access is assigned by an existing administrator and cannot be requested here.</p>
          {profile && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">You are signed in as a customer ({profile.email}). Sign in with an admin account to continue.</p>}
          <div className="mt-6"><LoginForm admin /></div>
        </div>
        <p className="mt-5 text-center text-sm text-white/60"><Link href="/" className="hover:text-white">Back to website</Link></p>
      </div>
    </main>
  );
}
