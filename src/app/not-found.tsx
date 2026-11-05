import Link from "next/link";
import { buttonCls } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-6 text-center">
      <div><h1 className="text-5xl">Page not found</h1><p className="mt-3 text-slate-600">The page you are looking for does not exist or has moved.</p><Link href="/" className={`${buttonCls("primary", "lg")} mt-6`}>Back to home</Link></div>
    </main>
  );
}
