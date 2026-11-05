import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SITE } from "@/lib/config";

export function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{SITE.description}</p>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/cars" className="hover:text-gold">Our fleet</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-gold">How it works</Link></li>
            <li><Link href="/#why-us" className="hover:text-gold">Why choose us</Link></li>
            <li><Link href="/#newsletter" className="hover:text-gold">Newsletter</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold text-white">Account</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/login" className="hover:text-gold">Log in</Link></li>
            <li><Link href="/register" className="hover:text-gold">Create account</Link></li>
            <li><Link href="/dashboard" className="hover:text-gold">My bookings</Link></li>
            <li><Link href="/admin/login" className="hover:text-gold">Staff sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><Mail size={16} className="mt-0.5 shrink-0 text-gold" />{SITE.email}</li>
            <li className="flex gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-gold" />{SITE.phone}</li>
            <li className="flex gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" />{SITE.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</div>
    </footer>
  );
}
