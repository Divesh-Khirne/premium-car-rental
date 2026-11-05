"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "./toast";
import { Field, buttonCls, inputCls } from "./ui";
import { initials } from "@/lib/utils";

export function ProfileForm({ profile }: { profile: { fullName: string; email: string; phone: string; avatar: string | null } }) {
  const router = useRouter(), toast = useToast(), file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.fullName), [phone, setPhone] = useState(profile.phone), [avatar, setAvatar] = useState(profile.avatar);
  const [busy, setBusy] = useState(false), [up, setUp] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: name, phone }) });
    const j = await res.json().catch(() => ({ ok: false, error: "Network error" }));
    setBusy(false);
    if (j.ok) { toast.success("Profile updated."); router.refresh(); } else toast.error(j.error ?? "Could not save.");
  }
  async function upload(f?: File) {
    if (!f) return; setUp(true);
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({ ok: false, error: "Network error" }));
    setUp(false);
    if (j.ok) { setAvatar(j.data.url); toast.success("Picture updated."); router.refresh(); } else toast.error(j.error ?? "Upload failed.");
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gold text-2xl font-bold text-navy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : initials(name)}
          </div>
          <button type="button" onClick={() => file.current?.click()} aria-label="Change profile picture" className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-navy text-white shadow">{up ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}</button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        <p className="text-sm text-slate-500">JPG, PNG or WebP, up to 2 MB.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} /></Field>
        <Field label="Phone number"><input value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} /></Field>
        <Field label="Email" className="sm:col-span-2" hint="Your login email cannot be changed here."><input value={profile.email} disabled className={inputCls} /></Field>
      </div>
      <button disabled={busy} className={buttonCls("primary")}>{busy && <Loader2 size={16} className="animate-spin" />}Save changes</button>
    </form>
  );
}
