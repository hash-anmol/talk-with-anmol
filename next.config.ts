import type { NextConfig } from "next";

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || undefined;

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
