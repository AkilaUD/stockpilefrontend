/**
 * Public content contracts (api.md §2.12, domain-model §9) as this app consumes
 * them — the editorial tree the reference serves at /news.
 *
 * One shape covers news, completed projects and supplier stories: the row's
 * `kind` is what selects the surface. `heroImageUrl` is null when no MediaAsset
 * was linked (honest empty), otherwise the same-origin catalogue media path.
 */

/** Editorial bucket (the reference's news categories, e.g. "Completed Jobs"). */
export interface ContentCategoryRef {
  slug: string;
  name: string;
}

/** Editorial tag; the slug is the link target of the reference's tag chips. */
export interface ContentTagRef {
  slug: string;
  name: string;
}

/** Content kinds the domain declares (domain-model §9). */
export const CONTENT_KINDS = [
  "NewsArticle",
  "ProjectCaseStudy",
  "SupplierStory",
  "CategoryGuide",
  "MaterialGuide",
  "ProcurementEducation",
  "SupplierSpotlight",
  "TechnicalArticle",
] as const;

export type ContentKind = (typeof CONTENT_KINDS)[number];

/**
 * Listing row (api.md §2.12 `GET /content/articles`). Carries the body because
 * the reference's list renders each post in full under its heading.
 */
export interface ArticleSummary {
  publicId: string;
  slug: string;
  kind: ContentKind;
  title: string;
  excerpt: string | null;
  body: string;
  heroImageUrl: string | null;
  categories: ContentCategoryRef[];
  tags: ContentTagRef[];
  publishedAt: string | null;
}

/** Full article (api.md §2.12 `GET /content/articles/{slug}`) plus §3.1 SEO fields. */
export interface ArticleDetail extends ArticleSummary {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
}

/** Offset pagination envelope with an exact total (api.md §2.12). */
export interface PagedArticleResponse {
  items: ArticleSummary[];
  totalItems: number;
  page: number;
  pageSize: number;
}

/**
 * The reference's news list shows six posts a page (measured 2026-10-14: 13
 * pages for its 73 linked posts), so the surface pages at the same size rather
 * than inventing its own rhythm.
 */
export const CONTENT_PAGE_SIZE = 6;
