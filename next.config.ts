import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/products": [
      "data/**/*",
      "public/products/**/*",
    ],
    "/products": [
      "data/**/*",
      "public/products/**/*",
    ],
    "/product/*": [
      "data/**/*",
      "public/products/**/*",
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
