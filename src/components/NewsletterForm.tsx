"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "./toast";

export function NewsletterForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await res.json().catch(() => ({ ok: false, error: "Network error" }));
    setBusy(false);
    if (j.ok) { toast.success("You are subscribed. Thank you!"); setEmail(""); } else toast.error(j.error ?? "Could not subscribe.");
  }
  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-gold focus:outline-none" />
      <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}Subscribe</button>
    </form>
  );
}
