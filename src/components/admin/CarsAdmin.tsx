"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, Plus, Star, Trash2, Upload, X } from "lucide-react";
import type { Car } from "@/types";
import { CarImage } from "../CarImage";
import { Modal } from "../modal";
import { useToast } from "../toast";
import { Field, buttonCls, inputCls } from "../ui";
import { CATEGORIES, FUELS, TRANSMISSIONS } from "@/lib/config";
import { money } from "@/lib/utils";

type Form = { name: string; brand: string; model: string; year: string; category: string; description: string; price_per_day: string; transmission: string; fuel_type: string; seating_capacity: string; mileage: string; features: string; image_urls: string[]; availability_status: string; is_featured: boolean };
const blank: Form = { name: "", brand: "", model: "", year: String(new Date().getFullYear()), category: "Sedan", description: "", price_per_day: "", transmission: "Automatic", fuel_type: "Petrol", seating_capacity: "5", mileage: "", features: "", image_urls: [], availability_status: "available", is_featured: false };
const toForm = (c: Car): Form => ({ ...c, year: String(c.year), price_per_day: String(c.price_per_day), seating_capacity: String(c.seating_capacity), features: c.features.join("\n"), image_urls: c.image_urls });

async function call(url: string, method: string, body?: unknown) {
  try { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); return (await r.json()) as { ok: boolean; error?: string }; }
  catch { return { ok: false, error: "Network error" }; }
}

export function CarsAdmin({ cars }: { cars: Car[] }) {
  const router = useRouter(), toast = useToast();
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [del, setDel] = useState<Car | null>(null);
  const [busy, setBusy] = useState(false), [up, setUp] = useState(false), [url, setUrl] = useState(""), [q, setQ] = useState("");
  const f = editing?.form;
  const set = (k: keyof Form, v: Form[keyof Form]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));
  const inp = (k: keyof Form) => ({ value: String(f?.[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k, e.target.value) });

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!editing || !f) return; setBusy(true);
    const payload = { ...f, features: f.features.split("\n").map((s) => s.trim()).filter(Boolean) };
    const r = await call(editing.id ? `/api/admin/cars/${editing.id}` : "/api/admin/cars", editing.id ? "PATCH" : "POST", payload);
    setBusy(false);
    if (r.ok) { toast.success(editing.id ? "Vehicle updated." : "Vehicle added."); setEditing(null); router.refresh(); } else toast.error(r.error ?? "Could not save.");
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return; setUp(true);
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd }).then((r) => r.json()).catch(() => ({ ok: false, error: "Network error" }));
      if (res.ok) setEditing((e) => (e ? { ...e, form: { ...e.form, image_urls: [...e.form.image_urls, res.data.url] } } : e)); else toast.error(res.error ?? "Upload failed.");
    }
    setUp(false);
  }
  async function quick(id: string, patch: Partial<Car>, msg: string) {
    const r = await call(`/api/admin/cars/${id}`, "PATCH", patch);
    if (r.ok) { toast.success(msg); router.refresh(); } else toast.error(r.error ?? "Update failed.");
  }
  async function remove() {
    if (!del) return; setBusy(true);
    const r = await call(`/api/admin/cars/${del.id}`, "DELETE"); setBusy(false);
    if (r.ok) { toast.success("Vehicle deleted."); setDel(null); router.refresh(); } else { toast.error(r.error ?? "Could not delete."); setDel(null); }
  }
  const shown = cars.filter((c) => `${c.name} ${c.brand} ${c.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl">Vehicles</h1><p className="mt-1 text-sm text-slate-500">{cars.length} in your fleet</p></div>
        <div className="flex gap-3"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vehicles" aria-label="Search vehicles" className={`${inputCls} !w-48`} /><button onClick={() => setEditing({ form: blank })} className={buttonCls("gold")}><Plus size={16} />Add vehicle</button></div>
      </div>
      <div className="card scroll-x mt-6">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="p-4">Vehicle</th><th className="p-4">Category</th><th className="p-4">Price/day</th><th className="p-4">Availability</th><th className="p-4">Featured</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((c) => (
              <tr key={c.id}>
                <td className="p-4"><div className="flex items-center gap-3"><CarImage src={c.image_urls[0]} alt="" className="h-11 w-16 rounded-lg object-cover" /><div><p className="font-semibold text-navy">{c.name}</p><p className="text-xs text-slate-500">{c.brand} {c.model} {c.year}</p></div></div></td>
                <td className="p-4">{c.category}</td><td className="p-4 font-medium">{money(c.price_per_day)}</td>
                <td className="p-4"><select aria-label={`Availability for ${c.name}`} value={c.availability_status} onChange={(e) => quick(c.id, { availability_status: e.target.value as Car["availability_status"] }, "Availability updated.")} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option></select></td>
                <td className="p-4"><button onClick={() => quick(c.id, { is_featured: !c.is_featured }, c.is_featured ? "Removed from featured." : "Added to featured.")} aria-label="Toggle featured" aria-pressed={c.is_featured}><Star size={18} className={c.is_featured ? "fill-gold text-gold" : "text-slate-300"} /></button></td>
                <td className="p-4"><div className="flex justify-end gap-1"><button onClick={() => setEditing({ id: c.id, form: toForm(c) })} aria-label={`Edit ${c.name}`} className="rounded-lg p-2 hover:bg-slate-100"><Pencil size={16} /></button><button onClick={() => setDel(c)} aria-label={`Delete ${c.name}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No vehicles found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit vehicle" : "Add vehicle"} wide>
        {f && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Display name"><input required {...inp("name")} className={inputCls} /></Field>
              <Field label="Brand"><input required {...inp("brand")} className={inputCls} /></Field>
              <Field label="Model"><input required {...inp("model")} className={inputCls} /></Field>
              <Field label="Year"><input type="number" required {...inp("year")} className={inputCls} /></Field>
              <Field label="Category"><select {...inp("category")} className={inputCls}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Price per day"><input type="number" min="1" step="0.01" required {...inp("price_per_day")} className={inputCls} /></Field>
              <Field label="Transmission"><select {...inp("transmission")} className={inputCls}>{TRANSMISSIONS.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Fuel type"><select {...inp("fuel_type")} className={inputCls}>{FUELS.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Seats"><input type="number" min="1" max="20" required {...inp("seating_capacity")} className={inputCls} /></Field>
              <Field label="Efficiency / range" hint="e.g. 14 km/l"><input {...inp("mileage")} className={inputCls} /></Field>
              <Field label="Availability"><select {...inp("availability_status")} className={inputCls}><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="unavailable">Unavailable</option></select></Field>
              <label className="flex items-end gap-2 pb-2.5 text-sm"><input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="h-4 w-4 accent-[#C9A96E]" />Show on homepage</label>
            </div>
            <Field label="Description"><textarea rows={3} {...inp("description")} className={inputCls} /></Field>
            <Field label="Features (one per line)"><textarea rows={4} {...inp("features")} className={inputCls} /></Field>
            <div>
              <p className="mb-2 text-sm font-medium">Images <span className="font-normal text-slate-500">(first image is the cover)</span></p>
              <div className="flex flex-wrap gap-3">
                {f.image_urls.map((u, i) => (
                  <div key={u + i} className="relative"><CarImage src={u} alt="" className="h-20 w-28 rounded-lg object-cover" />
                    <button type="button" onClick={() => set("image_urls", f.image_urls.filter((_, n) => n !== i))} aria-label="Remove image" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-rose-600 text-white"><X size={13} /></button></div>
                ))}
                <label className="grid h-20 w-28 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-gold">
                  {up ? <Loader2 className="animate-spin" size={18} /> : <span className="text-center"><Upload size={16} className="mx-auto mb-1" />Upload</span>}
                  <input type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} /></label>
              </div>
              <div className="mt-3 flex gap-2"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="...or paste an image URL / path like /images/cars/my-car.jpg" className={inputCls} /><button type="button" onClick={() => { if (url.trim()) { set("image_urls", [...f.image_urls, url.trim()]); setUrl(""); } }} className={buttonCls("outline")}>Add</button></div>
            </div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditing(null)} className={buttonCls("outline")}>Cancel</button><button disabled={busy} className={buttonCls("primary")}>{busy && <Loader2 size={16} className="animate-spin" />}{editing?.id ? "Save changes" : "Add vehicle"}</button></div>
          </form>
        )}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete vehicle?">
        <p className="text-sm text-slate-600">Delete <b>{del?.name}</b> permanently? Vehicles that already have bookings cannot be deleted. Set them to Unavailable instead.</p>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setDel(null)} className={buttonCls("outline")}>Cancel</button><button onClick={remove} disabled={busy} className={buttonCls("danger")}>Delete</button></div>
      </Modal>
    </div>
  );
}
