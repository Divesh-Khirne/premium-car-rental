"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Single orchestrated entrance used on the hero. Respects prefers-reduced-motion via CSS + framer. */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
