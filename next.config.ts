import type { NextConfig } from "next";

const assetPrefix =
  process.env.NEXT_PUBLIC_ASSET_PREFIX ||
  (process.env.VERCEL_ENV === "production"
    ? "https://talk-with-anmol.vercel.app"
    : undefined);

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
