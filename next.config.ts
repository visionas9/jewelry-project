import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opts into the Next 16 cache model so `use cache` works in lib/products.ts.
  // The catalog lives in Supabase but changes rarely — this keeps product pages
  // in the static shell instead of hitting the database on every request.
  cacheComponents: true,
};

export default nextConfig;
