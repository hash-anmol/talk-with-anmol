import type { NextConfig } from "next";

const assetPrefix = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const nextConfig: NextConfig = {
  assetPrefix,
  async rewrites() {
    return [
      {
        source: "/talkwithanmol/_next/:path*",
        destination: "/_next/:path*",
      },
      {
        source: "/talkwithanmol/:path*",
        destination: "/:path*",
      },
    ];
  },
};

export default nextConfig;
