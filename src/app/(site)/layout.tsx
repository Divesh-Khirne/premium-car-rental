import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSession } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSession();
  return (
    <>
      <Navbar user={profile ? { name: profile.full_name || profile.email, role: profile.role, avatar: profile.avatar_url } : null} />
      <main id="content" className="min-h-[70vh]">{children}</main>
      <Footer />
    </>
  );
}
