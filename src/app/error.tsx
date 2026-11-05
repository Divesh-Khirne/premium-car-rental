"use client";
import { buttonCls } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-6 text-center">
      <div><h1 className="text-4xl">Something went wrong</h1><p className="mt-3 text-slate-600">We could not load this page. Check your connection and try again.</p><button onClick={reset} className={`${buttonCls("primary", "lg")} mt-6`}>Try again</button></div>
    </main>
  );
}
