import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
