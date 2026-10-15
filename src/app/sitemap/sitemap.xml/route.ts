import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

/*
 * /sitemap/sitemap.xml — the reference's own sitemap path. The live footer's
 * "Sitemap" link points at `/sitemap/sitemap.xml`, so this route exists at that
 * exact URL rather than at the metadata-file default (`/sitemap.xml`); it is
 * listed in `src/proxy.ts`'s APP_ROUTED_URLS because a dotted path is otherwise
 * treated as a `public/` asset.
 *
 * Locale-independent: it enumerates the public editorial routes in both locales
 * and emits `<xhtml:link rel="alternate">` pairs so a crawler can pair the
 * English and Sinhala variants.
 *
 * The dynamic catalogue (categories, products, suppliers) is deliberately not
 * enumerated: it is large, API-driven, and changes per deploy. This file states
 * only what it can state truthfully — the static editorial set.
 */

const PUBLIC_PATHS = [
  "/",
  "/products",
  "/suppliers",
  "/search",
  "/rfq",
  "/quotations-and-estimations",
  "/how-it-works",
  "/how-it-works-for-buyers",
  "/how-it-works-for-suppliers",
  "/pricing",
  "/user-guide",
  "/user-guide-supplier-registration",
  "/user-guide-product-creation",
  "/user-guide-product-specifications",
  "/user-guide-supplier-quotation",
  "/user-guide-customer-creating-rfqs",
  "/user-guide-customer-viewing-quotations",
  "/user-guide-glossary",
  "/about-us",
  "/contact",
  "/careers",
  "/help",
  "/newest-products",
  "/return-policy",
  "/data-deletion-instructions",
  "/conversion-tables",
  "/terms-of-use",
  "/privacy-policy-cookie-restriction-mode",
  "/sitemap",
];

/** Absolute URL for one path in one locale (`as-needed` prefix). */
function href(origin: string, locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  return `${origin}${prefix}${suffix}` || `${origin}/`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function GET(request: NextRequest): Response {
  const origin = request.nextUrl.origin;

  const entries = PUBLIC_PATHS.map((path) => {
    const alternates = routing.locales
      .map(
        (locale) =>
          `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(
            href(origin, locale, path),
          )}"/>`,
      )
      .join("\n");
    return `  <url>\n    <loc>${escapeXml(href(origin, routing.defaultLocale, path))}</loc>\n${alternates}\n  </url>`;
  }).join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${entries}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
