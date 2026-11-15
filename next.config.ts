import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The brand images are small, already-compressed WebP files. Serving them as they are keeps them sharp
  // and uses none of the free plan's image-optimisation quota.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
