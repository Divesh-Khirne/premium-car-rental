"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Car } from "@/types";
import { CarCard } from "./CarCard";
import { EmptyState, inputCls } from "./ui";
import { CATEGORIES, FUELS, TRANSMISSIONS } from "@/lib/config";
import { money } from "@/lib/utils";

type Sort = "price-asc" | "price-desc" | "newest" | "popular";

export function CarsExplorer({ cars, unavailableIds, query, initialCategory = "" }: { cars: Car[]; unavailableIds: string[]; query: string; initialCategory?: string }) {
  const maxPrice = Math.max(100, ...cars.map((c) => Math.ceil(c.price_per_day / 10) * 10));
  const brands = useMemo(() => [...new Set(cars.map((c) => c.brand))].sort(), [cars]);
  const seatOptions = useMemo(() => [...new Set(cars.map((c) => c.seating_capacity))].sort((a, b) => a - b), [cars]);
  const blank = { q: "", brand: "", fuel: "", transmission: "", seats: "", category: CATEGORIES.includes(initialCategory as never) ? initialCategory : "", price: maxPrice, onlyFree: false };
  const [f, setF] = useState(blank);
  const [sort, setSort] = useState<Sort>("popular");
  const [open, setOpen] = useState(false);
  const blocked = useMemo(() => new Set(unavailableIds), [unavailableIds]);

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const r = cars.filter((c) =>
      (!q || `${c.name} ${c.brand} ${c.model} ${c.category}`.toLowerCase().includes(q)) &&
      (!f.brand || c.brand === f.brand) && (!f.fuel || c.fuel_type === f.fuel) && (!f.transmission || c.transmission === f.transmission) &&
      (!f.category || c.category === f.category) && (!f.seats || c.seating_capacity >= Number(f.seats)) &&
      c.price_per_day <= f.price && (!f.onlyFree || (!blocked.has(c.id) && c.availability_status === "available")));
    const s: Record<Sort, (a: Car, b: Car) => number> = {
      "price-asc": (a, b) => a.price_per_day - b.price_per_day, "price-desc": (a, b) => b.price_per_day - a.price_per_day,
      newest: (a, b) => +new Date(b.created_at) - +new Date(a.created_at) || b.year - a.year, popular: (a, b) => b.bookings_count - a.bookings_count,
    };
    return [...r].sort(s[sort]);
  }, [cars, f, sort, blocked]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const active = JSON.stringify(f) !== JSON.stringify(blank);
  const sel = (label: string, key: "brand" | "fuel" | "transmission" | "category" | "seats", opts: (string | number)[], fmt: (o: string | number) => string = String) => (
    <label className="block"><span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select value={f[key]} onChange={(e) => set(key, e.target.value)} className={inputCls}><option value="">All</option>{opts.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}</select></label>
  );

  const filters = (
    <div className="space-y-5">
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Search</span>
        <span className="relative block"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Name, brand or model" className={`${inputCls} pl-9`} /></span></label>
      {sel("Category", "category", [...CATEGORIES])}
      {sel("Brand", "brand", brands)}
      <label className="block"><span className="mb-1.5 flex justify-between text-sm font-medium"><span>Max price per day</span><span className="text-gold-dark">{money(f.price)}</span></span>
        <input type="range" min={20} max={maxPrice} step={5} value={f.price} onChange={(e) => set("price", Number(e.target.value))} className="w-full accent-[#C9A96E]" /></label>
      {sel("Fuel type", "fuel", [...FUELS])}
      {sel("Transmission", "transmission", [...TRANSMISSIONS])}
      {sel("Seats (minimum)", "seats", seatOptions, (o) => `${o}+ seats`)}
      {query && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.onlyFree} onChange={(e) => set("onlyFree", e.target.checked)} className="h-4 w-4 accent-[#C9A96E]" />Only cars free for my dates</label>}
      {active && <button onClick={() => setF(blank)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-dark hover:underline"><X size={14} />Clear all filters</button>}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block"><div className="card sticky top-24 p-5">{filters}</div></aside>
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite"><b className="text-navy">{list.length}</b> vehicle{list.length === 1 ? "" : "s"} found</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium lg:hidden" aria-expanded={open}><SlidersHorizontal size={16} />Filters</button>
            <select aria-label="Sort vehicles" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputCls} !w-auto`}>
              <option value="popular">Most popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest arrivals</option>
            </select>
          </div>
        </div>
        {open && <div className="card mb-6 p-5 lg:hidden">{filters}</div>}
        {list.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{list.map((c) => <CarCard key={c.id} car={c} query={query} unavailable={blocked.has(c.id)} />)}</div>
        ) : <EmptyState title="No vehicles match your filters" text="Try widening the price range or clearing a filter." action={<button onClick={() => setF(blank)} className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white">Clear filters</button>} />}
      </div>
    </div>
  );
}
