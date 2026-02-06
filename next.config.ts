import type { NextConfig } from "next";

const assetPrefix =
  process.env.NEXT_PUBLIC_ASSET_PREFIX ||
  (process.env.VERCEL_ENV === "production"
    ? "https://talk-with-anmol.vercel.app"
    : undefined);

const nextConfig: NextConfig = {
  assetPrefix,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "talk-with-anmol.vercel.app",
      },
    ],
  },
};

export default nextConfig;
