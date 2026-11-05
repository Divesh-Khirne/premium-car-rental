"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "./toast";
import { buttonCls, inputCls } from "./ui";

export function ReviewForm({ carId }: { carId: string }) {
  const toast = useToast(), router = useRouter();
  const [rating, setRating] = useState(5), [comment, setComment] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carId, rating, comment }) });
    const j = await res.json().catch(() => ({ ok: false }));
    setBusy(false);
    if (j.ok) { toast.success("Thanks for your review!"); router.refresh(); } else toast.error(j.error ?? "Could not post review.");
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-gold/50 bg-gold/5 p-5">
      <p className="font-semibold text-navy">How was your rental?</p>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}><Star size={26} className={n <= rating ? "fill-gold text-gold" : "text-slate-300"} /></button>)}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder="Tell others about the car (optional)" className={`${inputCls} mt-3`} />
      <button disabled={busy} className={`${buttonCls("primary", "sm")} mt-3`}>{busy ? "Posting..." : "Post review"}</button>
    </form>
  );
}
