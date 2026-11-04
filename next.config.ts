import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's persistent cache relies on atomic renames, which fail on some Windows setups (EBUSY).
    turbopackFileSystemCacheForBuild: false,
    turbopackFileSystemCacheForDev: false,
    // Chat attachments are uploaded through a server action (up to 5 × 10 MB per message).
    serverActions: { bodySizeLimit: "52mb" },
  },
};

export default nextConfig;
