import Link from "next/link";
import { SITE } from "@/lib/config";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-navy">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden><path d="M5 15l1.6-4.2A2 2 0 018.5 9.5h7a2 2 0 011.9 1.3L19 15v3h-2v-1H7v1H5v-3zm3-1.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm8 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM8.2 11l-.8 2h9.2l-.8-2H8.2z" /></svg>
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? "text-white" : "text-navy"}`}>{SITE.name}</span>
    </Link>
  );
}
