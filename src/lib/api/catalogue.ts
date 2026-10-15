import { apiFetch } from "./client";

/**
 * Public catalogue surface (api.md §2.3–§2.5, §3.1) — wire types + the
 * client-side calls the interactive pieces need.
 *
 * Every shape mirrors a record in `Stockpile.Contracts.Catalogue` exactly:
 * camel case on the wire, optional members omitted rather than null (api.md
 * §1.4), and no field invented that the backend does not send. X2: no invented
 * surface. Only the command-search overlay (and its typeahead) fetch from the
 * browser — everything else is Server Component work and lives in
 * `./catalogue-server`.
 *
 * This module is plain (no "use client"): types are erased at compile time and
 * the two fetch helpers below are only ever called from client components.
 */

// --------------------------------------------------------------- wire types

export interface SupplierRef {
  publicId: string;
  slug: string;
  name: string;
  verified: boolean;
  district?: string;
  verification?: string;
}

export interface CategoryRef {
  slug: string;
  name: string;
}

/** Unit-of-measure reference row (api.md §2.3 `GET /catalog/units`, Contracts.Catalogue.UnitOfMeasureRef). */
export interface UnitOfMeasureRef {
  code: string;
  name: string;
  pluralName: string;
  dimensionKind: string;
}

export interface ProductAttributeValueRef {
  code: string;
  label: string;
  value?: string | null;
  unit?: string | null;
}

export interface ProductImageRef {
  srcset?: string | null;
  alt?: string | null;
}

export interface PriceRef {
  state: string;
  amount?: number | null;
  currency: string;
  minQuantity?: number | null;
  unitCode?: string | null;
  unitName?: string | null;
  taxState?: string | null;
  effectiveAt?: string | null;
}

export interface ProductListItem {
  publicId: string;
  slug: string;
  name: string;
  sku: string;
  supplier: SupplierRef;
  category: CategoryRef;
  price?: PriceRef | null;
  priceState: string;
  stockState: string;
  minOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  itemType: string;
  attributes: ProductAttributeValueRef[];
  image?: ProductImageRef | null;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetRange {
  dataType: string;
  unit?: string | null;
  min: number;
  max: number;
}

export interface Facet {
  key: string;
  label: string;
  type: string;
  options?: FacetOption[] | null;
  range?: FacetRange | null;
  count?: number | null;
}

export interface ZeroResultBridge {
  message: string;
  rfqPath?: string | null;
  categorySuggestion?: CategoryRef | null;
}

export interface SearchResponse {
  query: string;
  total: number;
  took: number;
  engine: string;
  items: ProductListItem[];
  facets: Facet[];
  suggestions: string[];
  zeroResultBridge?: ZeroResultBridge | null;
}

export interface PagedProductResponse {
  items: ProductListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
  facets?: Facet[] | null;
}

export interface CategoryNode {
  slug: string;
  name: string;
  nameSi?: string | null;
  parentSlug?: string | null;
  sortOrder: number;
  isRoot: boolean;
  children: CategoryNode[];
}

export interface CategoryDetailResponse {
  category: CategoryNode;
  products: ProductListItem[];
  totalProducts: number;
}

export interface PriceHistoryEntry {
  at: string;
  amount: number;
}

export interface StockRef {
  state: string;
  tracked: boolean;
  lowStockThreshold?: number | null;
}

export interface BrandRef {
  code: string;
  name: string;
}

export interface CountryOfOriginRef {
  code: string;
  name: string;
}

export interface OriginRef {
  countryOfOrigin?: CountryOfOriginRef | null;
  countryOfManufacture?: CountryOfOriginRef | null;
}

export interface SpecificationRow {
  code: string;
  label: string;
  value?: string | null;
  dataType: string;
  unit?: string | null;
  isFilterable: boolean;
}

export interface SpecificationSection {
  label: string;
  attributes: SpecificationRow[];
}

export interface SpecificationsRef {
  sections: SpecificationSection[];
  completenessScore?: number | null;
}

export interface VisibilityRef {
  priceVisible: boolean;
  reason?: string | null;
}

export interface SupplierDetailRef {
  publicId: string;
  slug: string;
  name: string;
  verification: string;
  district?: string | null;
  memberSince?: string | null;
  verifiedAt?: string | null;
}

export interface ProductDetailResponse {
  publicId: string;
  slug: string;
  name: string;
  itemType: string;
  sku: string;
  status: string;
  supplier: SupplierDetailRef;
  price?: PriceRef | null;
  priceHistory?: PriceHistoryEntry[] | null;
  stock?: StockRef | null;
  minOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  brand?: BrandRef | null;
  origin?: OriginRef | null;
  summary?: string | null;
  description?: string | null;
  specifications?: SpecificationsRef | null;
  media: ProductImageRef[];
  visibility: VisibilityRef;
  canAddToRfq: boolean;
  relatedProducts?: ProductListItem[] | null;
  relatedSuppliers?: SupplierRef[] | null;
}

export interface CatalogueSummary {
  products: number;
  suppliers: number;
  categories: number;
}

export interface SupplierDirectoryItem {
  publicId: string;
  slug: string;
  name: string;
  verified: boolean;
  district?: string | null;
  location?: string | null;
  productCount?: number | null;
  logo?: ProductImageRef | null;
}

export interface SupplierDirectoryResponse {
  items: SupplierDirectoryItem[];
  totalItems: number;
}

export interface SupplierDetailResponse {
  publicId: string;
  slug: string;
  name: string;
  verification: string;
  verified: boolean;
  story?: string | null;
  district?: string | null;
  location?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  productCount?: number | null;
  categories: string[];
  featuredProducts?: ProductListItem[] | null;
  logo?: ProductImageRef | null;
  banner?: ProductImageRef | null;
}

export interface CommandSearchResponse {
  query: string;
  products: ProductListItem[];
  categories: CategoryNode[];
  suppliers: SupplierDirectoryItem[];
}

/** Supported sort keys on the listing/search endpoints (CatalogueStore). */
export const SORT_KEYS = ["relevance", "newest", "price_asc", "price_desc", "name"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

// --------------------------------------------------------------- client calls

/** Command-search overlay payload (§13) — the one browser-side catalogue read. */
export function fetchCommandSearch(q: string, signal?: AbortSignal): Promise<CommandSearchResponse> {
  return apiFetch<CommandSearchResponse>(`/api/v1/search/command?q=${encodeURIComponent(q)}`, {}, { signal });
}

/** Typeahead suggestions (api.md §2.3). */
export function fetchSuggestions(q: string, signal?: AbortSignal): Promise<string[]> {
  return apiFetch<string[]>(`/api/v1/search/suggestions?q=${encodeURIComponent(q)}`, {}, { signal });
}