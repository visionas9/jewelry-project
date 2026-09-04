import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opts into the Next 16 cache model so `use cache` works in lib/products.ts.
  // The catalog lives in Supabase but changes rarely — this keeps product pages
  // in the static shell instead of hitting the database on every request.
  cacheComponents: true,

  // Blog cover images are served from the Supabase Storage bucket rather than
  // from the repository, so next/image has to be told the host is allowed.
  // Built from the same env var the clients use, so a project change needs no
  // second edit here.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost"
        ).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
