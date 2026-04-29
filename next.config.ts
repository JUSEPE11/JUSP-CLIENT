import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/products": [
      "data/**/*",
    ],
    "/products": [
      "data/**/*",
    ],
    "/product/*": [
      "data/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/api/**": [
      "public/**/*",
      "*.md",
      "*.zip",
      "tsconfig.tsbuildinfo",
    ],
    "/api/orders/release-expired": [
      "data/**/*",
    ],
  },
};

export default nextConfig;
