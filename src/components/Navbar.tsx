"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Shield, X } from "lucide-react";
import { Logo } from "./Logo";
import { buttonCls } from "./ui";
import { initials } from "@/lib/utils";

const links = [{ href: "/", label: "Home" }, { href: "/cars", label: "Fleet" }, { href: "/#how-it-works", label: "How it works" }, { href: "/#why-us", label: "Why us" }];

export function Navbar({ user }: { user: { name: string; role: "customer" | "admin"; avatar: string | null } | null }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const home = path === "/";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/"); router.refresh();
  }

  return (
    <header className={`sticky top-0 z-50 border-b ${home ? "border-white/10 bg-navy/90" : "border-slate-200 bg-white/90"} backdrop-blur-md`}>
      <div className="container-x flex h-16 items-center justify-between">
        <Logo light={home} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${home ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-navy"} ${path === l.href ? (home ? "text-white" : "text-navy") : ""}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "admin" && <Link href="/admin" className={buttonCls("ghost", "sm") + (home ? " !text-white hover:!bg-white/10" : "")}><Shield size={15} />Admin</Link>}
              <Link href="/dashboard" className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium ${home ? "bg-white/10 text-white" : "bg-slate-100 text-navy"}`}>
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-gold text-xs font-bold text-navy">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
                </span>
                {user.name.split(" ")[0] || "Account"}
              </Link>
              <button onClick={logout} aria-label="Log out" className={`rounded-lg p-2 ${home ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-navy"}`}><LogOut size={18} /></button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonCls("ghost", "sm") + (home ? " !text-white hover:!bg-white/10" : "")}>Log in</Link>
              <Link href="/register" className={buttonCls("gold", "sm")}>Sign up</Link>
            </>
          )}
        </div>
        <button className={`rounded-lg p-2 md:hidden ${home ? "text-white" : "text-navy"}`} onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 bg-white md:hidden">
            <div className="container-x flex flex-col gap-1 py-4">
              {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium text-navy hover:bg-slate-50">{l.label}</Link>)}
              <div className="mt-2 grid gap-2 border-t border-slate-100 pt-4">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className={buttonCls("outline")}><LayoutDashboard size={16} />My dashboard</Link>
                    {user.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)} className={buttonCls("outline")}><Shield size={16} />Admin panel</Link>}
                    <button onClick={logout} className={buttonCls("primary")}><LogOut size={16} />Log out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className={buttonCls("outline")}>Log in</Link>
                    <Link href="/register" onClick={() => setOpen(false)} className={buttonCls("gold")}>Create account</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
