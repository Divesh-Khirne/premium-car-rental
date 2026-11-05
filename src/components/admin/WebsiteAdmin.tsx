"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Car, PromoBanner, Testimonial } from "@/types";
import { Modal } from "../modal";
import { useToast } from "../toast";
import { Field, Stars, buttonCls, inputCls } from "../ui";

async function call(url: string, method: string, body?: unknown) {
  try { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return (await r.json()) as { ok: boolean; error?: string }; }
  catch { return { ok: false, error: "Network error" }; }
}

export function WebsiteAdmin({ cars, banners, testimonials }: { cars: Car[]; banners: PromoBanner[]; testimonials: Testimonial[] }) {
  const router = useRouter(), toast = useToast();
  const [b, setB] = useState<(Partial<PromoBanner> & { open: true }) | null>(null);
  const [t, setT] = useState<(Partial<Testimonial> & { open: true }) | null>(null);
  const [busy, setBusy] = useState(false);
  const done = (r: { ok: boolean; error?: string }, msg: string, close?: () => void) => { if (r.ok) { toast.success(msg); close?.(); router.refresh(); } else toast.error(r.error ?? "Something went wrong."); };

  async function saveBanner(e: React.FormEvent) {
    e.preventDefault(); if (!b) return; setBusy(true);
    const body = { title: b.title ?? "", subtitle: b.subtitle ?? "", cta_label: b.cta_label || "Book now", cta_href: b.cta_href || "/cars", is_active: b.is_active ?? true };
    const r = await call(b.id ? `/api/admin/banners/${b.id}` : "/api/admin/banners", b.id ? "PATCH" : "POST", body); setBusy(false); done(r, "Banner saved.", () => setB(null));
  }
  async function saveT(e: React.FormEvent) {
    e.preventDefault(); if (!t) return; setBusy(true);
    const body = { customer_name: t.customer_name ?? "", review: t.review ?? "", rating: t.rating ?? 5, is_featured: t.is_featured ?? true };
    const r = await call(t.id ? `/api/admin/testimonials/${t.id}` : "/api/admin/testimonials", t.id ? "PATCH" : "POST", body); setBusy(false); done(r, "Testimonial saved.", () => setT(null));
  }
  return (
    <div className="space-y-10">
      <div><h1 className="text-3xl">Website</h1><p className="mt-1 text-sm text-slate-500">Control what visitors see on the homepage.</p></div>

      <section><h2 className="mb-1 text-2xl">Featured vehicles</h2><p className="mb-4 text-sm text-slate-500">Up to six featured cars appear on the homepage, most popular first.</p>
        <div className="card divide-y divide-slate-100">
          {cars.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium text-navy">{c.brand} {c.name}</p><p className="text-xs text-slate-500">{c.category}</p></div>
              <button onClick={async () => done(await call(`/api/admin/cars/${c.id}`, "PATCH", { is_featured: !c.is_featured }), c.is_featured ? "Removed from homepage." : "Added to homepage.")} aria-pressed={c.is_featured} className={buttonCls(c.is_featured ? "gold" : "outline", "sm")}><Star size={14} className={c.is_featured ? "fill-current" : ""} />{c.is_featured ? "Featured" : "Feature"}</button></div>
          ))}
        </div>
      </section>

      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl">Promotional banners</h2><p className="text-sm text-slate-500">The newest active banner is shown on the homepage.</p></div><button onClick={() => setB({ open: true, is_active: true })} className={buttonCls("gold", "sm")}><Plus size={15} />New banner</button></div>
        <div className="space-y-3">
          {banners.map((x) => (
            <div key={x.id} className="card flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-semibold text-navy">{x.title}</p><p className="truncate text-sm text-slate-500">{x.subtitle}</p><p className="mt-1 text-xs text-slate-400">Button: {x.cta_label} to {x.cta_href}</p></div>
              <div className="flex items-center gap-2"><button onClick={async () => done(await call(`/api/admin/banners/${x.id}`, "PATCH", { is_active: !x.is_active }), "Banner updated.")} className={buttonCls(x.is_active ? "primary" : "outline", "sm")}>{x.is_active ? "Active" : "Hidden"}</button>
                <button onClick={() => setB({ open: true, ...x })} aria-label="Edit banner" className="rounded-lg p-2 hover:bg-slate-100"><Pencil size={16} /></button>
                <button onClick={async () => confirm("Delete this banner?") && done(await call(`/api/admin/banners/${x.id}`, "DELETE"), "Banner deleted.")} aria-label="Delete banner" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div></div>
          ))}
          {!banners.length && <p className="text-sm text-slate-500">No banners yet.</p>}
        </div>
      </section>

      <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl">Testimonials</h2><p className="text-sm text-slate-500">Featured testimonials appear on the homepage.</p></div><button onClick={() => setT({ open: true, rating: 5, is_featured: true })} className={buttonCls("gold", "sm")}><Plus size={15} />Add testimonial</button></div>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((x) => (
            <div key={x.id} className="card p-5"><div className="flex items-center justify-between"><Stars value={x.rating} /><span className={`text-xs font-semibold ${x.is_featured ? "text-emerald-700" : "text-slate-400"}`}>{x.is_featured ? "Shown" : "Hidden"}</span></div>
              <p className="mt-3 text-sm text-slate-700">{x.review}</p><p className="mt-3 text-sm font-semibold text-navy">{x.customer_name}</p>
              <div className="mt-3 flex gap-2"><button onClick={async () => done(await call(`/api/admin/testimonials/${x.id}`, "PATCH", { is_featured: !x.is_featured }), "Testimonial updated.")} className={buttonCls("outline", "sm")}>{x.is_featured ? "Hide" : "Show"}</button><button onClick={() => setT({ open: true, ...x })} className={buttonCls("outline", "sm")}>Edit</button><button onClick={async () => confirm("Delete this testimonial?") && done(await call(`/api/admin/testimonials/${x.id}`, "DELETE"), "Testimonial deleted.")} className={buttonCls("ghost", "sm") + " !text-rose-600"}>Delete</button></div></div>
          ))}
        </div>
      </section>

      <Modal open={!!b} onClose={() => setB(null)} title={b?.id ? "Edit banner" : "New banner"}>
        <form onSubmit={saveBanner} className="space-y-4">
          <Field label="Headline"><input required value={b?.title ?? ""} onChange={(e) => setB((s) => s && { ...s, title: e.target.value })} className={inputCls} /></Field>
          <Field label="Supporting text"><textarea rows={2} value={b?.subtitle ?? ""} onChange={(e) => setB((s) => s && { ...s, subtitle: e.target.value })} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Button label"><input value={b?.cta_label ?? ""} onChange={(e) => setB((s) => s && { ...s, cta_label: e.target.value })} className={inputCls} /></Field><Field label="Button link" hint="e.g. /cars"><input value={b?.cta_href ?? ""} onChange={(e) => setB((s) => s && { ...s, cta_href: e.target.value })} className={inputCls} /></Field></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b?.is_active ?? true} onChange={(e) => setB((s) => s && { ...s, is_active: e.target.checked })} className="h-4 w-4 accent-[#C9A96E]" />Show on homepage</label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setB(null)} className={buttonCls("outline")}>Cancel</button><button disabled={busy} className={buttonCls("primary")}>Save banner</button></div>
        </form>
      </Modal>
      <Modal open={!!t} onClose={() => setT(null)} title={t?.id ? "Edit testimonial" : "Add testimonial"}>
        <form onSubmit={saveT} className="space-y-4">
          <Field label="Customer name"><input required value={t?.customer_name ?? ""} onChange={(e) => setT((s) => s && { ...s, customer_name: e.target.value })} className={inputCls} /></Field>
          <Field label="Review"><textarea required rows={3} value={t?.review ?? ""} onChange={(e) => setT((s) => s && { ...s, review: e.target.value })} className={inputCls} /></Field>
          <Field label="Rating"><select value={t?.rating ?? 5} onChange={(e) => setT((s) => s && { ...s, rating: Number(e.target.value) })} className={inputCls}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={t?.is_featured ?? true} onChange={(e) => setT((s) => s && { ...s, is_featured: e.target.checked })} className="h-4 w-4 accent-[#C9A96E]" />Show on homepage</label>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setT(null)} className={buttonCls("outline")}>Cancel</button><button disabled={busy} className={buttonCls("primary")}>Save testimonial</button></div>
        </form>
      </Modal>
    </div>
  );
}
