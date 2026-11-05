"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { buttonCls } from "./ui";

export function LogoutButton({ to = "/", className }: { to?: string; className?: string }) {
  const router = useRouter();
  return (
    <button className={className ?? buttonCls("outline", "sm")} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push(to); router.refresh(); }}>
      <LogOut size={15} />Log out
    </button>
  );
}
