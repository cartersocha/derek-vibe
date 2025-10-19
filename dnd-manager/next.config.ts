import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "@hookform/resolvers",
      "react-hook-form",
      "@supabase/supabase-js",
      "@supabase/ssr",
      "sanitize-html",
    ],
  },
};

export default nextConfig;
