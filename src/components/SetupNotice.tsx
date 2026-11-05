import { SITE } from "@/lib/config";

/** Friendly screen shown when .env.local is missing or still has placeholder values. */
export function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-navy p-6">
      <div className="max-w-xl rounded-2xl bg-white p-8 shadow-lift">
        <h1 className="text-3xl">Almost there: connect Supabase</h1>
        <p className="mt-3 text-slate-600">{SITE.name} is installed, but it does not know your Supabase project yet.</p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Copy <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> to <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code></li>
          <li>Paste your Supabase <b>Project URL</b> and <b>anon / publishable key</b> into it</li>
          <li>Stop the server (Ctrl + C) and run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code> again</li>
        </ol>
        <p className="mt-5 text-sm text-slate-500">Full instructions: README.md, Step 4.</p>
      </div>
    </main>
  );
}
