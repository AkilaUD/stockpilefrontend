import { ApiClientError } from "./envelope";
import type {
  CatalogueSummary,
  CategoryDetailResponse,
  CategoryNode,
  PagedProductResponse,
  ProductDetailResponse,
  SearchResponse,
  SortKey,
  SupplierDirectoryResponse,
  SupplierDetailResponse,
} from "./catalogue";

/**
 * Server-render data reads for the public catalogue (api.md §2.3–§2.5).
 *
 * Browser-facing code cannot use this module: it reads `API_ORIGIN` and
 * fetches the .NET origin directly, because during SSR there is no running
 * browser to hit the `next.config` rewrite. Server Components import the
 * helpers here; client components import `./catalogue`. Nothing in this file
 * may be imported from a `"use client"` module, or `API_ORIGIN` (and the
 * absolute origin) would leak into the client bundle.
 *
 * `cache: "no-store"` matches the browser transport's policy (client.ts): the
 * catalogue is live platform state — exact totals, fresh audience policy —
 * never snapshot data.
 */

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:5080";

async function serverGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    // The envelope is already rendered into friendly copy by the backend for
    // browsers; SSR cares about status semantics (404 → notFound()), so the
    // envelope body is not needed here.
    throw new ApiClientError(response.status, null, null);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined && entry[1] !== null && entry[1] !== "",
  );
  if (entries.length === 0) return "";
  return `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&")}`;
}

export const CATALOGUE_PAGE_SIZE = 24;

export function getCatalogueSummary(): Promise<CatalogueSummary> {
  return serverGet<CatalogueSummary>("/api/v1/catalog/summary");
}

export function getCategoryTree(): Promise<CategoryNode[]> {
  return serverGet<CategoryNode[]>("/api/v1/catalog/categories");
}

export interface ProductListingParams {
  category?: string;
  q?: string;
  sort?: SortKey;
  verifiedOnly?: boolean;
  inStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export function getProductListing(params: ProductListingParams = {}): Promise<PagedProductResponse> {
  return serverGet<PagedProductResponse>(
    `/api/v1/catalog/products${queryString({
      category: params.category,
      q: params.q,
      sort: params.sort === undefined || params.sort === "relevance" ? undefined : params.sort,
      verifiedOnly: params.verifiedOnly,
      inStockOnly: params.inStockOnly,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? CATALOGUE_PAGE_SIZE,
    })}`,
  );
}

export function getProductDetail(slug: string): Promise<ProductDetailResponse> {
  return serverGet<ProductDetailResponse>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`);
}

export function getCategoryDetail(slug: string, page = 1): Promise<CategoryDetailResponse> {
  return serverGet<CategoryDetailResponse>(
    `/api/v1/catalog/categories/${encodeURIComponent(slug)}?page=${page}&pageSize=${CATALOGUE_PAGE_SIZE}`,
  );
}

export function getSupplierDirectory(q?: string): Promise<SupplierDirectoryResponse> {
  return serverGet<SupplierDirectoryResponse>(`/api/v1/suppliers${queryString({ q })}`);
}

export function getSupplierProducts(slug: string, page = 1): Promise<PagedProductResponse> {
  return serverGet<PagedProductResponse>(
    `/api/v1/suppliers/${encodeURIComponent(slug)}/products?page=${page}&pageSize=${CATALOGUE_PAGE_SIZE}`,
  );
}

export function getSupplierDetail(slug: string): Promise<SupplierDetailResponse> {
  return serverGet<SupplierDetailResponse>(`/api/v1/suppliers/${encodeURIComponent(slug)}`);
}

export function getSearchResults(params: { q: string; page?: number }): Promise<SearchResponse> {
  return serverGet<SearchResponse>(
    `/api/v1/catalog/search${queryString({ q: params.q, page: params.page ?? 1 })}`,
  );
}