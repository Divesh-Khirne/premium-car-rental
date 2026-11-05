"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "./toast";
import { Field, buttonCls, inputCls } from "./ui";
import { createClient } from "@/lib/supabase/client";

async function post(url: string, body: unknown) {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await res.json()) as { ok: boolean; error?: string; data?: Record<string, unknown> };
  } catch { return { ok: false, error: "Network error. Please check your connection." }; }
}
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={show ? "text" : "password"} className={`${inputCls} pr-11`} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-500 hover:text-navy">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </span>
  );
}
function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return <button disabled={busy} className={`${buttonCls("primary", "lg")} w-full`}>{busy && <Loader2 size={18} className="animate-spin" />}{children}</button>;
}

export function LoginForm({ next, admin = false, notice }: { next?: string; admin?: boolean; notice?: string }) {
  const router = useRouter(), toast = useToast();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(notice ?? "");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await post(admin ? "/api/auth/admin-login" : "/api/auth/login", { email, password });
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Could not sign in.");
    toast.success("Welcome back!");
    router.push(admin ? "/admin" : r.data?.role === "admin" && !next ? "/dashboard" : safeNext(next)); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Email"><input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
      <Field label="Password"><PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{err}</p>}
      <Submit busy={busy}>{admin ? "Sign in to admin" : "Log in"}</Submit>
      {!admin && <p className="text-center text-sm"><Link href="/forgot-password" className="font-medium text-gold-dark hover:underline">Forgot your password?</Link></p>}
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter(), toast = useToast();
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await post("/api/auth/register", f);
    setBusy(false);
    if (!r.ok) return setErr(r.error ?? "Could not create account.");
    if (r.data?.needsConfirmation) return setSent(true);
    toast.success("Account created. Welcome!"); router.push("/dashboard"); router.refresh();
  }
  if (sent) return <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900"><p className="font-semibold">Check your inbox</p><p className="mt-1">We sent a confirmation link to {f.email}. Open it to activate your account, then <Link href="/login" className="font-semibold underline">log in</Link>.</p></div>;
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Full name"><input required autoComplete="name" value={f.fullName} onChange={set("fullName")} className={inputCls} /></Field>
      <Field label="Email"><input type="email" required autoComplete="email" value={f.email} onChange={set("email")} className={inputCls} /></Field>
      <Field label="Phone number"><input type="tel" required autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="+1 555 010 2030" className={inputCls} /></Field>
      <Field label="Password" hint="At least 8 characters"><PasswordInput required autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>
      <Field label="Confirm password"><PasswordInput required autoComplete="new-password" value={f.confirmPassword} onChange={set("confirmPassword")} /></Field>
      {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{err}</p>}
      <Submit busy={busy}>Create account</Submit>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await post("/api/auth/forgot", { email }); setBusy(false);
    r.ok ? setSent(true) : setErr(r.error ?? "Something went wrong.");
  }
  if (sent) return <div className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">If an account exists for <b>{email}</b>, a reset link is on its way. It can take a minute to arrive.</div>;
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="Email"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
      {err && <p role="alert" className="text-sm font-medium text-rose-600">{err}</p>}
      <Submit busy={busy}>Send reset link</Submit>
    </form>
  );
}

export function ResetForm() {
  const router = useRouter(), toast = useToast();
  const [p, setP] = useState(""), [c, setC] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (p.length < 8) return setErr("Password must be at least 8 characters.");
    if (p !== c) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: p });
    setBusy(false);
    if (error) return setErr(error.message);
    toast.success("Password updated."); router.push("/dashboard"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Field label="New password" hint="At least 8 characters"><PasswordInput required autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} /></Field>
      <Field label="Confirm new password"><PasswordInput required autoComplete="new-password" value={c} onChange={(e) => setC(e.target.value)} /></Field>
      {err && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">{err}</p>}
      <Submit busy={busy}>Update password</Submit>
    </form>
  );
}
