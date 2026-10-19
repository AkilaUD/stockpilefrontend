import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { API_ORIGIN } from "@/lib/api/origin";
import { categoryHref } from "@/lib/navigation/navigation";

export const runtime = "nodejs";

/*
 * /sitemap/sitemap.xml — reference path. Enumerates static editorial routes,
 * /news (+ posts when the content API answers), and a bounded catalogue sample
 * (category tree + newest products) so the map stays truthful without dumping
 * the entire SKU list into every crawl.
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
  "/news",
];

const CATALOGUE_PRODUCT_CAP = 200;
const NEWS_PAGE_SIZE = 100;

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

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_ORIGIN}${path}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

interface CategoryNode {
  slug: string;
  children?: CategoryNode[];
}

function flattenCategories(nodes: CategoryNode[], into: string[] = []): string[] {
  for (const node of nodes) {
    if (node.slug) into.push(node.slug);
    if (node.children?.length) flattenCategories(node.children, into);
  }
  return into;
}

async function dynamicPaths(): Promise<string[]> {
  const paths: string[] = [];

  const articles = await fetchJson<{ items?: { slug: string }[] }>(
    `/api/v1/content/articles?page=1&pageSize=${NEWS_PAGE_SIZE}`,
  );
  for (const item of articles?.items ?? []) {
    if (item.slug) paths.push(`/news/post/${encodeURIComponent(item.slug)}`);
  }

  const tree = await fetchJson<CategoryNode[]>("/api/v1/catalog/categories");
  if (tree) {
    for (const slug of flattenCategories(tree)) {
      paths.push(categoryHref(slug));
    }
  }

  const products = await fetchJson<{ items?: { slug: string }[] }>(
    `/api/v1/catalog/products?sort=newest&page=1&pageSize=${CATALOGUE_PRODUCT_CAP}`,
  );
  for (const item of products?.items ?? []) {
    if (item.slug) paths.push(`/products/${encodeURIComponent(item.slug)}`);
  }

  const suppliers = await fetchJson<{ items?: { slug: string }[] }>(
    "/api/v1/suppliers",
  );
  for (const item of suppliers?.items ?? []) {
    if (item.slug) paths.push(`/suppliers/${encodeURIComponent(item.slug)}`);
  }

  return paths;
}

function urlEntry(origin: string, path: string): string {
  const alternates = routing.locales
    .map(
      (locale) =>
        `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(
          href(origin, locale, path),
        )}"/>`,
    )
    .join("\n");
  return `  <url>\n    <loc>${escapeXml(href(origin, routing.defaultLocale, path))}</loc>\n${alternates}\n  </url>`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const origin = request.nextUrl.origin;
  const extra = await dynamicPaths();
  const allPaths = [...PUBLIC_PATHS, ...extra];
  const seen = new Set<string>();
  const entries = allPaths
    .filter((path) => {
      if (seen.has(path)) return false;
      seen.add(path);
      return true;
    })
    .map((path) => urlEntry(origin, path))
    .join("\n");

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
