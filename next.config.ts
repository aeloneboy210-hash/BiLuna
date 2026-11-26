import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The brand images are small, already-compressed WebP files. Serving them as they are keeps them sharp
  // and uses none of the free plan's image-optimisation quota.
  images: { unoptimized: true },
  // A report or prescription (up to 3 MB) travels to the chat action as base64, about 4 MB.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Basic protection on every page: no showing BiLuna inside another site's frame (so no one can trick a
  // patient into tapping "Share" or "Delete"), no guessing file types, and no full addresses sent to
  // other sites.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
