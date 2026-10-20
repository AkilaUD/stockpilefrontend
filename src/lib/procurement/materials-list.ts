import type { ProductListItem } from "@/lib/api/catalogue";
import type { RfqItemValues } from "@/lib/validation/rfq";

/**
 * The visitor's materials list — the working page of the Material Ledger.
 *
 * One list, edited on the homepage and carried into the RFQ form. It lives in
 * localStorage because it is the visitor's own draft: no account, no server
 * state, nothing claimed as "sent" until an authenticated RFQ submit succeeds.
 * Every access no-ops safely when storage is unavailable.
 */

export interface LedgerLine {
  /** Stable local identity (never sent to the API). */
  key: string;
  description: string;
  specification: string;
  quantity: string;
  unitOfMeasureCode: string;
  categorySlug: string;
  /* Catalogue provenance, when the line came from a real product. */
  sku?: string;
  supplierName?: string;
  priceState?: string;
  priceAmount?: number | null;
  priceCurrency?: string;
  priceUnitName?: string | null;
}

const STORAGE_KEY = "stockpile.materials-list.v1";
const EMPTY: LedgerLine[] = [];

let counter = 0;
function nextKey(): string {
  counter += 1;
  return `line-${Date.now().toString(36)}-${counter}`;
}

export function blankLine(): LedgerLine {
  return {
    key: nextKey(),
    description: "",
    specification: "",
    quantity: "",
    unitOfMeasureCode: "",
    categorySlug: "",
  };
}

/** Map a live catalogue product onto a ledger line. RFQ items carry no
 *  product id, so the SKU travels inside the specification (see toRfqItem). */
export function lineFromProduct(product: ProductListItem): LedgerLine {
  return {
    key: nextKey(),
    description: product.name,
    specification: "",
    quantity: product.minOrderQuantity ? String(product.minOrderQuantity) : "1",
    unitOfMeasureCode: product.price?.unitCode ?? "",
    /* Product categories are leaf paths ("building-materials/paint/...");
       the RFQ form trades in root departments, so keep the first segment. */
    categorySlug: product.category?.slug?.split("/")[0] ?? "",
    sku: product.sku,
    supplierName: product.supplier?.name,
    priceState: product.price?.state ?? product.priceState,
    priceAmount: product.price?.amount ?? null,
    priceCurrency: product.price?.currency ?? "LKR",
    priceUnitName: product.price?.unitName ?? null,
  };
}

/** Parse an unknown stored value into lines; anything unreadable is empty. */
export function parseLines(raw: string | null): LedgerLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
      .map((row) => ({
        key: typeof row.key === "string" && row.key ? row.key : nextKey(),
        description: typeof row.description === "string" ? row.description : "",
        specification: typeof row.specification === "string" ? row.specification : "",
        quantity: typeof row.quantity === "string" ? row.quantity : "",
        unitOfMeasureCode: typeof row.unitOfMeasureCode === "string" ? row.unitOfMeasureCode : "",
        categorySlug: typeof row.categorySlug === "string" ? row.categorySlug : "",
        sku: typeof row.sku === "string" ? row.sku : undefined,
        supplierName: typeof row.supplierName === "string" ? row.supplierName : undefined,
        priceState: typeof row.priceState === "string" ? row.priceState : undefined,
        priceAmount: typeof row.priceAmount === "number" ? row.priceAmount : null,
        priceCurrency: typeof row.priceCurrency === "string" ? row.priceCurrency : undefined,
        priceUnitName: typeof row.priceUnitName === "string" ? row.priceUnitName : null,
      }));
  } catch {
    return EMPTY;
  }
}

export function loadLines(): LedgerLine[] {
  try {
    return parseLines(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

function persist(lines: LedgerLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* best-effort: a list that cannot persist still works in-page */
  }
}

/* --- External store: hero sheet, register rows and the builder share one list. */
let cache: LedgerLine[] | null = null;
const listeners = new Set<() => void>();

function snapshot(): LedgerLine[] {
  if (cache === null) cache = loadLines();
  return cache;
}

function commit(lines: LedgerLine[]): void {
  cache = lines;
  persist(lines);
  listeners.forEach((listener) => listener());
}

export const materialsListStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): LedgerLine[] {
    return snapshot();
  },
  getServerSnapshot(): LedgerLine[] {
    return EMPTY;
  },
  /** Adds a product once — re-adding a SKU already on the list is a no-op. */
  addProduct(product: ProductListItem): void {
    const lines = snapshot();
    if (product.sku && lines.some((line) => line.sku === product.sku)) return;
    commit([...lines, lineFromProduct(product)]);
  },
  addBlank(): void {
    commit([...snapshot(), blankLine()]);
  },
  update(key: string, patch: Partial<LedgerLine>): void {
    commit(snapshot().map((line) => (line.key === key ? { ...line, ...patch } : line)));
  },
  remove(key: string): void {
    commit(snapshot().filter((line) => line.key !== key));
  },
  duplicate(key: string): void {
    const lines = snapshot();
    const index = lines.findIndex((line) => line.key === key);
    if (index < 0) return;
    const copy: LedgerLine = { ...lines[index], key: nextKey(), sku: undefined };
    commit([...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)]);
  },
  clear(): void {
    commit([]);
  },
};

export interface LedgerSubtotal {
  /** Lines with a public price and a parseable positive quantity. */
  pricedLines: number;
  /** Lines priced on request — deliberately excluded from the figure. */
  porLines: number;
  /** Priced lines whose quantity is not yet usable. */
  awaitingQuantity: number;
  amount: number;
  currency: string;
}

/**
 * Honest indicative subtotal: only `Public` prices with an amount and a
 * positive quantity contribute. POR lines are counted, never priced as zero.
 */
export function computeSubtotal(lines: LedgerLine[]): LedgerSubtotal {
  let amount = 0;
  let pricedLines = 0;
  let porLines = 0;
  let awaitingQuantity = 0;
  let currency = "LKR";
  for (const line of lines) {
    const isPublic = line.priceState === "Public" && typeof line.priceAmount === "number";
    if (!isPublic) {
      if (line.description.trim() || line.sku) porLines += 1;
      continue;
    }
    const quantity = Number(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      awaitingQuantity += 1;
      continue;
    }
    pricedLines += 1;
    amount += (line.priceAmount as number) * quantity;
    if (line.priceCurrency) currency = line.priceCurrency;
  }
  return { pricedLines, porLines, awaitingQuantity, amount, currency };
}

/** One ledger line → one RFQ item. SKU provenance rides in the specification. */
export function toRfqItem(line: LedgerLine): RfqItemValues {
  const specParts = [line.specification.trim(), line.sku ? `SKU: ${line.sku}` : ""].filter(Boolean);
  return {
    description: line.description.trim(),
    quantity: line.quantity.trim(),
    categorySlug: line.categorySlug,
    unitOfMeasureCode: line.unitOfMeasureCode,
    specification: specParts.join(" · "),
  };
}

/** Lines worth carrying into the RFQ form (a description is the minimum). */
export function toRfqItems(lines: LedgerLine[]): RfqItemValues[] {
  return lines.filter((line) => line.description.trim().length > 0).map(toRfqItem);
}
