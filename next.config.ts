import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      fs: { browser: "./lib/studio/empty-module.js" },
    },
  },
};

export default nextConfig;
