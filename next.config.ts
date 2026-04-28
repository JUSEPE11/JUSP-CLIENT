import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/api/**": [
      "public/**/*",
      "*.md",
      "*.zip",
      "tsconfig.tsbuildinfo",
      ".next/**/*",
    ],
    "/api/orders/release-expired": [
      "data/**/*",
    ],
  },
};

export default nextConfig;
