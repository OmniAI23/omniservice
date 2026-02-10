import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Note: rewrites don't work with output: 'export', 
  // but that's okay because FastAPI handles the /api routes.
};

export default nextConfig;
