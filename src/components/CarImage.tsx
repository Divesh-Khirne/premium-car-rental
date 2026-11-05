"use client";
import { useState } from "react";
import { Car as CarIcon } from "lucide-react";

/** Plain <img> with a graceful fallback so a broken link never shows a broken-image icon. */
export function CarImage({ src, alt, className = "", eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`grid place-items-center bg-slate-200 text-slate-400 ${className}`} role="img" aria-label={alt}><CarIcon size={40} /></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} className={className} />;
}
