import { queryString, serverGet } from "./server";
import {
  CONTENT_PAGE_SIZE,
  type ArticleDetail,
  type ContentCategoryRef,
  type ContentKind,
  type PagedArticleResponse,
} from "./content";

/**
 * Server-render reads for the public editorial tree (api.md §2.12), on the
 * shared SSR transport (see `./server`).
 *
 * Every read passes the active locale. The backend answers a locale it holds no
 * rows for with the default content locale — the reference's Sinhala store view
 * serves the English article and translates only the chrome around it, so an
 * untranslated `/si/news` is the reference's own behaviour, not a fallback we
 * invented.
 */

export interface ArticleListParams {
  /** Single-kind filter; omitted means every kind (what /news lists). */
  kind?: ContentKind;
  /** Bucket slug (`/news/category/{slug}`). */
  category?: string;
  /** Tag slug (`/news/tag/{slug}`). */
  tag?: string;
  locale?: string;
  page?: number;
  pageSize?: number;
}

export function getArticles(params: ArticleListParams = {}): Promise<PagedArticleResponse> {
  return serverGet<PagedArticleResponse>(
    `/api/v1/content/articles${queryString({
      kind: params.kind,
      category: params.category,
      tag: params.tag,
      locale: params.locale,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? CONTENT_PAGE_SIZE,
    })}`,
  );
}

export function getArticle(slug: string, locale?: string): Promise<ArticleDetail> {
  return serverGet<ArticleDetail>(
    `/api/v1/content/articles/${encodeURIComponent(slug)}${queryString({ locale })}`,
  );
}

/** The editorial buckets the news tree navigates by. */
export function getContentCategories(): Promise<ContentCategoryRef[]> {
  return serverGet<ContentCategoryRef[]>("/api/v1/content/categories");
}
