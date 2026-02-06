import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/talkwithanmol",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/talkwithanmol",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
