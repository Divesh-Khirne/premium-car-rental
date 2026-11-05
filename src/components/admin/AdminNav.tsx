"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CalendarCheck, Car, Globe, LayoutDashboard, Menu, Users, X } from "lucide-react";
import { Logo } from "../Logo";
import { LogoutButton } from "../LogoutButton";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard }, { href: "/admin/cars", label: "Vehicles", icon: Car },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck }, { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: BarChart3 }, { href: "/admin/website", label: "Website", icon: Globe },
];

export function AdminNav({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {items.map(({ href, label, icon: I }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${active ? "bg-gold text-navy" : "text-white/75 hover:bg-white/10 hover:text-white"}`}><I size={18} />{label}</Link>;
      })}
    </nav>
  );
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-navy px-4 lg:hidden">
        <Logo light />
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="p-2 text-white">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="fixed inset-x-0 top-14 z-30 bg-navy p-4 shadow-lift lg:hidden">{nav}<div className="mt-4 border-t border-white/10 pt-4"><LogoutButton to="/admin/login" className="text-sm text-white/70" /></div></div>}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy p-5 lg:flex">
        <Logo light />
        <p className="mb-6 mt-1 pl-11 text-xs text-white/50">Admin console</p>
        {nav}
        <div className="mt-auto border-t border-white/10 pt-4"><p className="mb-2 truncate text-sm text-white/70">{name}</p><LogoutButton to="/admin/login" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white" /></div>
      </aside>
    </>
  );
}
