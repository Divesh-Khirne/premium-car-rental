"use client";
import { useState } from "react";
import { CarImage } from "./CarImage";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [""];
  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-card"><CarImage src={list[i]} alt={alt} eager className="h-full w-full object-cover" /></div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {list.slice(0, 8).map((s, n) => (
            <button key={s + n} onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-current={n === i} className={`aspect-[16/10] overflow-hidden rounded-xl ring-2 transition ${n === i ? "ring-gold" : "ring-transparent opacity-70 hover:opacity-100"}`}>
              <CarImage src={s} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
