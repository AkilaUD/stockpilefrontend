import type { CategoryNode } from "@/lib/api/catalogue";

/*
 * One authoritative navigation source (reference reconstruction Phase 2 §4.4).
 *
 * Everything the header, footer, mobile drawer and home page render as
 * "navigation" is derived from this module, so the desktop menu, the mobile
 * drawer and the home "Most Searched" tiles can never drift apart. All
 * destinations here resolve to real routes in this application.
 *
 * Reference: https://stockpile.lk/ "Shop By Department" menu (verified
 * 2026-10-13). The backend category tree (/api/v1/catalog/categories) is the
 * data source — every label below is a backend department slug; the order is
 * the reference menu's order. `services` and `training` have no slot in the
 * reference menu but are real backend departments, so they append at the end.
 */

/** Reference "Shop By Department" top-level order (slug → index for sorting). */
export const DEPARTMENT_ORDER = [
  "building-materials",
  "bathrooms",
  "door-windows",
  "electrical",
  "flooring",
  "hardware",
  "plumbing",
  "roofing-ceiling",
  "tools-equipment",
  "landscape-external-works",
  "services",
  "training",
] as const;

/** Sort a backend category tree into reference order; unknown roots append. */
export function sortDepartments(tree: CategoryNode[]): CategoryNode[] {
  const bySlug = new Map(tree.map((node) => [node.slug, node]));
  const ordered = DEPARTMENT_ORDER.map((slug) => bySlug.get(slug)).filter(
    (node): node is CategoryNode => node !== undefined,
  );
  const seen = new Set(ordered.map((node) => node.slug));
  const extras = tree.filter((node) => !seen.has(node.slug));
  return [...ordered, ...extras];
}

/**
 * Href for a category page. Backend category slugs are FULL PATHS
 * ("flooring/floor-carpets", "plumbing/water-pumps/submersible-water-pumps"),
 * while the category route is a single dynamic segment — the slashes have to
 * be percent-encoded or the URL splits into segments and 404s on the
 * catch-all. `[slug]` decodes the %2F back into the real slug before the
 * page fetches it. Every category link in the app goes through this helper
 * so the four call sites (desktop menu, mobile drawer, home tiles, category
 * breadcrumb) can never drift apart again.
 */
export function categoryHref(slug: string): string {
  return `/categories/${encodeURIComponent(slug)}`;
}

/**
 * Reference row icons for the vertical menu (20×20 PNGs — not every department
 * has one). Do not use these as mosaic/cover photography; add DEPARTMENT_PHOTOS
 * (≥800px assets) when real department images are available.
 */
export const DEPARTMENT_ICONS: Record<string, string> = {
  "building-materials": "/original/departments/building-materials.png",
  bathrooms: "/original/departments/bathrooms.png",
  "door-windows": "/original/departments/door-windows.png",
  electrical: "/original/departments/electrical.png",
  flooring: "/original/departments/flooring.png",
  hardware: "/original/departments/hardware.png",
  plumbing: "/original/departments/plumbing.png",
  "roofing-ceiling": "/original/departments/roofing-ceiling.png",
};

export interface NavLink {
  /** next-intl message key under the `nav` namespace. */
  labelKey: string;
  href: string;
}

/** Utility bar (top, yellow): Get Quotes · Pricing · Supplier List. */
export const UTILITY_LINKS: NavLink[] = [
  { labelKey: "getQuotes", href: "/quotations-and-estimations" },
  { labelKey: "pricing", href: "/pricing" },
  { labelKey: "supplierList", href: "/suppliers" },
];

/**
 * Hub bar (yellow, under the masthead): the reference's own order and set —
 * "Get Quotes How It Works News About Us Help" (captured from the reference's
 * hub bar in tests/parity/home-1440.json §hubLinks).
 *
 * News points at `/news`, the editorial tree (api.md §2.12), once the last
 * placeholder in this bar. The reference's *footer* carries no News link, so
 * neither does ours: the footer groups below are the reference's own.
 *
 * The reference's hub "Get Quotes" points at its request-quote page
 * (`/b2bmarketplace/customer/requestquote/`), while the utility bar's
 * "Get Quotes" points at `/quotations-and-estimations` — two different
 * destinations under one label. They map to `/rfq` (the real submission
 * surface) and `/quotations-and-estimations` (the info page) respectively
 * (verified 2026-10-13).
 */
export const HUB_LINKS: NavLink[] = [
  { labelKey: "getQuotes", href: "/rfq" },
  { labelKey: "howItWorks", href: "/how-it-works" },
  { labelKey: "news", href: "/news" },
  { labelKey: "aboutUs", href: "/about-us" },
  { labelKey: "help", href: "/help" },
];

/**
 * The masthead's "header links" (reference `ul.header.links`, verified
 * 2026-10-13): Log In · Register · Supplier Login · Supplier Registration ·
 * Request For Quote. Log In and Register are already the account-status
 * island's job (it is the one control that knows whether a session exists), so
 * this group carries the other three. Request For Quote points at`/rfq` — the
 * real api.md §2.6 submission surface — which is the same destination the
 * reference's own link uses.
 */
export const SUPPLIER_LINKS: NavLink[] = [
  { labelKey: "supplierLogin", href: "/supplier-login" },
  { labelKey: "supplierRegistration", href: "/supplier-register" },
  { labelKey: "requestForQuote", href: "/rfq" },
];

/** Mobile drawer quick links (matches the reference mobile menu). */
export const MOBILE_QUICK_LINKS: NavLink[] = [
  { labelKey: "getQuotes", href: "/quotations-and-estimations" },
  { labelKey: "howItWorks", href: "/how-it-works" },
  { labelKey: "ourSuppliers", href: "/suppliers" },
  { labelKey: "aboutUs", href: "/about-us" },
  { labelKey: "contact", href: "/contact" },
  { labelKey: "help", href: "/help" },
];

export interface MostSearchedTile {
  /** next-intl message key under `home.mostSearched`. */
  labelKey: string;
  href: string;
  image: string;
  alt: string;
}

/**
 * "Most Searched Products" — the reference home tiles, each mapped to the
 * real backend category it belongs to (verified against the 2026-10-13 tree),
 * so every tile lands on a functional category page instead of a wallpaper
 * link. Artwork is the original tile PNG (public/original/most-searched).
 */
export const MOST_SEARCHED: MostSearchedTile[] = [
  {
    labelKey: "t1",
    href: categoryHref("building-materials/steel-items/box-bars-square-tubes"),
    image: "/original/most-searched/box-bar.png",
    alt: "GI & Steel Box Bar",
  },
  {
    labelKey: "t2",
    href: categoryHref("building-materials/steel-items"),
    image: "/original/most-searched/gi-pipes.png",
    alt: "GI & Steel Pipes",
  },
  {
    labelKey: "t3",
    href: categoryHref("landscape-external-works/fences/chain-link-fences"),
    image: "/original/most-searched/chain-link-fences.png",
    alt: "Chain Link Fences",
  },
  {
    labelKey: "t4",
    href: categoryHref("building-materials/aluminium"),
    image: "/original/most-searched/aluminium-cladding.png",
    alt: "Aluminium Cladding",
  },
  {
    labelKey: "t5",
    href: categoryHref("building-materials/panels-partitions/plastic-sheets-panels/pvc-eco-boards"),
    image: "/original/most-searched/pvc-eco-board.png",
    alt: "PVC Eco Board",
  },
  {
    labelKey: "t6",
    href: categoryHref("building-materials/timber/planks"),
    image: "/original/most-searched/kempas.png",
    alt: "Kempas",
  },
];

/** Footer link groups (matches the reference footer). */
export const FOOTER_GROUPS: Array<{
  /** next-intl key under the `footer` namespace for the group title. */
  titleKey: string;
  links: NavLink[];
}> = [
  {
    titleKey: "stockpileGroup",
    links: [
      { labelKey: "howItWorks", href: "/how-it-works" },
      { labelKey: "supplierBenefits", href: "/how-it-works-for-suppliers" },
      { labelKey: "registerAsSupplier", href: "/pricing" },
    ],
  },
  {
    titleKey: "companyGroup",
    links: [
      { labelKey: "aboutUs", href: "/about-us" },
      { labelKey: "contact", href: "/contact" },
      { labelKey: "termsOfUse", href: "/terms-of-use" },
    ],
  },
  {
    titleKey: "supportGroup",
    links: [
      { labelKey: "userGuide", href: "/user-guide" },
      { labelKey: "sitemap", href: "/sitemap/sitemap.xml" },
    ],
  },
];

/** Social profiles — hrefs read from the reference footer's own markup. */
export const SOCIAL_LINKS = [
  { labelKey: "linkedin", href: "https://www.linkedin.com/company/stockpilelk/" },
  { labelKey: "facebook", href: "https://www.facebook.com/stockpilesrilanka" },
  { labelKey: "instagram", href: "https://www.instagram.com/stockpile.lk/" },
  { labelKey: "youtube", href: "https://www.youtube.com/@stockpileLK" },
] as const;