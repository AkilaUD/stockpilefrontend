/*
 * MUST stay first. See scripts/swc-cache.js — `next-intl/plugin` loads the SWC
 * native addon at module scope, and import order (unlike statement order) is
 * preserved through transpilation.
 */
import "./scripts/swc-cache";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

/*
 * The .NET API is never exposed to the browser as a second origin.
 * The browser calls same-origin `/api/v1/*` on :3000 and this rewrite forwards
 * it to the API origin, which keeps cookies first-party and lets production run
 * with zero CORS (docs/architecture.md §4, security-threat-model §7).
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5080";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Static header set — security-threat-model §13.
 *
 * HSTS is production-only: emitting it over plain http in development would
 * pin localhost to HTTPS and is unrecoverable without clearing browser state.
 * The CSP itself is attached per-response in `src/proxy.ts` because it carries
 * a per-response nonce (§9), which a static `headers()` entry cannot express.
 */
const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // Content-negotiated media is served by the API, never optimised on the fly
  // from a remote host — see image-asset-plan.md (self-hosted, no hotlinking).
  images: {
    formats: ["image/avif", "image/webp"],
    // Local files only. No remote pattern is declared, so `next/image` cannot
    // be pointed at an arbitrary external host (SSRF-shaped misconfiguration).
    remotePatterns: [],
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
