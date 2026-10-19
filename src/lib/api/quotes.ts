import { apiFetch } from "./client";

/**
 * Quote submit + lifecycle (api.md §2.7).
 */

export type QuoteCoverage = "Full" | "Partial";
export type QuoteTaxState = "TaxIncluded" | "TaxExcluded" | "TaxExempt";

export interface CreateQuoteItemRequest {
  rfqItemId: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  substitutionNote?: string;
}

export interface CreateQuoteRequest {
  rfqMatchId: string;
  coverage: QuoteCoverage;
  currency: string;
  leadTimeDays?: number;
  validityDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  deliveryCost?: number;
  taxState: QuoteTaxState;
  discountPercent?: number;
  packSizeNote?: string;
  moqNote?: string;
  technicalNotes?: string;
  supplierNote?: string;
  items: CreateQuoteItemRequest[];
}

export interface QuoteTotals {
  subtotal: number;
  discountTotal: number;
  deliveryCost: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}

export interface QuoteCoverageSummary {
  requestedLines: number;
  quotedLines: number;
  missingLineNumbers: number[];
}

export interface QuoteResponse {
  publicId: string;
  quoteNumber: string;
  status: string;
  revisionNumber: number;
  totals: QuoteTotals;
  coverage: QuoteCoverageSummary;
}

export interface QuoteSummary {
  publicId: string;
  quoteNumber: string;
  rfqId: string;
  rfqReference: string;
  rfqTitle: string;
  supplierId: string;
  supplierName: string;
  status: string;
  revisionNumber: number;
  grandTotal: number;
  currency: string;
  leadTimeDays?: number | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReviseQuoteRequest {
  coverage: QuoteCoverage;
  currency: string;
  leadTimeDays?: number;
  validityDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  deliveryCost?: number;
  taxState: QuoteTaxState;
  discountPercent?: number;
  packSizeNote?: string;
  moqNote?: string;
  technicalNotes?: string;
  supplierNote?: string;
  revisionKind?: string;
  items: CreateQuoteItemRequest[];
}

export interface RfqComparisonResponse {
  rfqId: string;
  rfqReference: string;
  quoteCount: number;
  comparable: boolean;
  requestedLines: Array<{
    rfqItemId: string;
    lineNumber: number;
    description: string;
    quantity: number;
  }>;
  quotes: Array<{
    quoteId: string;
    quoteNumber: string;
    supplierId: string;
    supplierName: string;
    status: string;
    revisionNumber: number;
    totals: QuoteTotals;
    leadTimeDays?: number | null;
    validUntil?: string | null;
    paymentTerms?: string | null;
    deliveryTerms?: string | null;
    coverage: QuoteCoverageSummary;
  }>;
  annotations: Array<{ kind: string; quoteId: string; detail: string }>;
}

export interface AcceptQuoteResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  stockReservationState: string;
}

const QUOTES = "/api/v1/quotes";

export const quotesApi = {
  submit: (
    body: CreateQuoteRequest,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<QuoteResponse>(
      QUOTES,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  get: (quoteId: string) => apiFetch<QuoteResponse>(`${QUOTES}/${encodeURIComponent(quoteId)}`),

  listMineSupplier: () => apiFetch<QuoteSummary[]>("/api/v1/suppliers/me/quotes"),

  listMineBuyer: () => apiFetch<QuoteSummary[]>("/api/v1/me/quotes"),

  revise: (
    quoteId: string,
    body: ReviseQuoteRequest,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<QuoteResponse>(
      `${QUOTES}/${encodeURIComponent(quoteId)}/revisions`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  withdraw: (
    quoteId: string,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<QuoteResponse>(
      `${QUOTES}/${encodeURIComponent(quoteId)}/withdraw`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  accept: (quoteId: string, csrfToken: string, idempotencyKey: string = crypto.randomUUID()) =>
    apiFetch<AcceptQuoteResponse>(
      `${QUOTES}/${encodeURIComponent(quoteId)}/accept`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  decline: (
    quoteId: string,
    reason: string,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<QuoteResponse>(
      `${QUOTES}/${encodeURIComponent(quoteId)}/decline`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  requestRevision: (
    quoteId: string,
    kind: string,
    reason: string,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<QuoteResponse>(
      `${QUOTES}/${encodeURIComponent(quoteId)}/revision-requests`,
      {
        method: "POST",
        body: JSON.stringify({ kind, reason }),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),

  comparison: (rfqId: string) =>
    apiFetch<RfqComparisonResponse>(
      `/api/v1/rfqs/${encodeURIComponent(rfqId)}/comparison`,
    ),
};
