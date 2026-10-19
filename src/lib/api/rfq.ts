import { apiFetch } from "./client";

/**
 * RFQ endpoint surface (api.md §2.6) — every shape mirrors a record in
 * `Stockpile.Contracts.Procurement.RfqContracts`, so X2 (no invented surface)
 * holds: create a draft, submit it (the server runs matching), and the buyer's
 * own reads. Ownership is organisational and decided server-side; the browser
 * never chooses the organisation.
 *
 * Camel case is the wire casing; optional members are omitted, never null
 * (api.md §1.4).
 */

/** Company identity used to provision the buyer's organisation on a first request. */
export interface RfqCompanyDraft {
  name: string;
  registrationNumber?: string;
  website?: string;
}

/** One requested line (domain-model §5.3). `categorySlug` selects the matching department. */
export interface CreateRfqItemRequest {
  description: string;
  quantity: number;
  categorySlug?: string;
  unitOfMeasureCode?: string;
  specification?: string;
}

/** `POST /rfqs` — the draft, items inline (api.md §2.6). */
export interface CreateRfqRequest {
  title: string;
  company?: RfqCompanyDraft;
  deliveryLocationText?: string;
  substitutionsAllowed: boolean;
  specialInstructions?: string;
  expiryDays?: number;
  items: CreateRfqItemRequest[];
}

export interface RfqItemResponse {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  categorySlug?: string | null;
  unitOfMeasure?: string | null;
  specification?: string | null;
}

/** One matched supplier in the buyer's dispatch view. */
export interface RfqMatchSummary {
  supplierId: string;
  supplierName: string;
  supplierSlug: string;
  status: string;
  matchScore: number;
  matchReasons: string;
}

export interface RfqResponse {
  id: string;
  referenceCode: string;
  title: string;
  status: string;
  organizationId: string;
  visibility: string;
  source: string;
  substitutionsAllowed: boolean;
  deliveryLocationText?: string | null;
  specialInstructions?: string | null;
  submittedAt?: string | null;
  expiryAt?: string | null;
  items: RfqItemResponse[];
  matches: RfqMatchSummary[];
}

const RFQ_PATH = "/api/v1/rfqs";

export const rfqApi = {
  /** Create a Draft RFQ (buyer capability `rfq.create`, rate-limited). */
  create: (body: CreateRfqRequest, csrfToken: string) =>
    apiFetch<RfqResponse>(RFQ_PATH, { method: "POST", body: JSON.stringify(body) }, { csrfToken }),
  /**
   * Submit a draft; the server runs matching and answers the dispatched RFQ.
   * Requires a GUID `Idempotency-Key` (api.md §1.7) so retries replay instead of
   * re-matching. Callers should mint one key per submit attempt
   * (`crypto.randomUUID()`).
   */
  submit: (rfqId: string, csrfToken: string, idempotencyKey: string = crypto.randomUUID()) =>
    apiFetch<RfqResponse>(
      `${RFQ_PATH}/${rfqId}/submit`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),
  /** One RFQ the caller's organisation owns; a foreign id answers the BOLA 404. */
  get: (rfqId: string) => apiFetch<RfqResponse>(`${RFQ_PATH}/${rfqId}`),
  /** The caller's organisations' RFQs, newest first (api.md §2.6). */
  mine: () => apiFetch<RfqResponse[]>("/api/v1/me/rfqs"),
};
