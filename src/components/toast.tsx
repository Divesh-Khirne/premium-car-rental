"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type T = { id: number; kind: "success" | "error"; text: string };
const Ctx = createContext<{ success: (t: string) => void; error: (t: string) => void }>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((kind: T["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, kind, text }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4500);
  }, []);
  const api = useMemo(() => ({ success: (t: string) => push("success", t), error: (t: string) => push("error", t) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-lift">
              {t.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
