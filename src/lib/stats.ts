export const monthKey = (d: string) => d.slice(0, 7);
/** The last n calendar months as { key: "2026-11", label: "Nov" } (oldest first). */
export function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [], now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-GB", { month: "short" }) });
  }
  return out;
}
