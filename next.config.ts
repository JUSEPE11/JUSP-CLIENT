import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/api/orders": [
      "public/**/*",
      "data/**/*",
      "*.md",
      "*.zip",
      "tsconfig.tsbuildinfo",
      ".next/**/*",
    ],
    "/api/orders/release-expired": [
      "public/**/*",
      "data/**/*",
      "*.md",
      "*.zip",
      "tsconfig.tsbuildinfo",
      ".next/**/*",
    ],
  },
};

export default nextConfig;
