import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/toast";
import { SetupNotice } from "@/components/SetupNotice";
import { SITE } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: { default: `${SITE.name} | Premium car rental`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  icons: { icon: "/icons/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#101827", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{isSupabaseConfigured ? children : <SetupNotice />}</ToastProvider>
      </body>
    </html>
  );
}
