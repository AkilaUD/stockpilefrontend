import { queryString, serverGet } from "./server";
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
  UnitOfMeasureRef,
} from "./catalogue";

/**
 * Server-render data reads for the public catalogue (api.md §2.3–§2.5).
 *
 * Reads go through the shared SSR transport (`./server`), so the catalogue and
 * the editorial surface share one timeout/retry policy. Server Components
 * import the helpers here; client components import `./catalogue`.
 */

export const CATALOGUE_PAGE_SIZE = 24;

export function getCatalogueSummary(): Promise<CatalogueSummary> {
  return serverGet<CatalogueSummary>("/api/v1/catalog/summary");
}

export function getCategoryTree(): Promise<CategoryNode[]> {
  return serverGet<CategoryNode[]>("/api/v1/catalog/categories");
}

export function getUnits(): Promise<UnitOfMeasureRef[]> {
  return serverGet<UnitOfMeasureRef[]>("/api/v1/catalog/units");
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
    `/api/v1/catalog/search${queryString({
      q: params.q,
      page: params.page ?? 1,
      pageSize: CATALOGUE_PAGE_SIZE,
    })}`,
  );
}