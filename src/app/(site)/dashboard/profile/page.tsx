import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit profile" };
export default async function ProfilePage() {
  const { profile } = await requireUser("/dashboard/profile");
  return (
    <div className="container-x max-w-2xl py-10">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy">&larr; Back to dashboard</Link>
      <h1 className="mb-6 mt-3 text-4xl">Your profile</h1>
      <div className="card p-6 sm:p-8"><ProfileForm profile={{ fullName: profile.full_name, email: profile.email, phone: profile.phone ?? "", avatar: profile.avatar_url }} /></div>
    </div>
  );
}
