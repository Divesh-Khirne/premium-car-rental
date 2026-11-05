import type { NextConfig } from "next";

/**
 * EDIT HERE: if you store car photos in Supabase Storage, the hostname below is
 * derived automatically from NEXT_PUBLIC_SUPABASE_URL. Add more hosts if you use
 * other image providers.
 */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
