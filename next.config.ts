import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project so Next.js doesn't mistakenly
    // pick up the package-lock.json in the home directory.
    root: import.meta.dirname,
  },
};

export default nextConfig;
