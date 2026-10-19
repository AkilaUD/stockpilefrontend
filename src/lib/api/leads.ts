import { apiFetch } from "./client";

/**
 * Supplier buying-lead inbox (api.md §2.9) — mirrors
 * `SupplierLeadsContracts` / `SupplierLeadsController`.
 */

export type SupplierLeadStatusFilter =
  | "new"
  | "due_soon"
  | "quoted"
  | "negotiating"
  | "won"
  | "lost"
  | "follow_up";

export interface SupplierLeadSummary {
  leadId: string;
  status: string;
  referenceCode: string;
  title: string;
  receivedAt?: string | null;
  respondBy?: string | null;
  requestedDeliveryAt?: string | null;
  lineCount: number;
  viewedAt?: string | null;
  declineReason?: string | null;
}

export interface SupplierLeadPage {
  items: SupplierLeadSummary[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface SupplierLeadLine {
  rfqItemId: string;
  lineNumber: number;
  description: string;
  specification?: string | null;
  quantity: number;
  unitCode?: string | null;
  expectedAt?: string | null;
  notes?: string | null;
}

export interface SupplierLeadDetail {
  leadId: string;
  status: string;
  rfqId: string;
  referenceCode: string;
  title: string;
  deliveryLocationText?: string | null;
  requestedDeliveryAt?: string | null;
  respondBy?: string | null;
  substitutionsAllowed: boolean;
  buyerNotes?: string | null;
  lines: SupplierLeadLine[];
  notifiedAt?: string | null;
  viewedAt?: string | null;
  respondedAt?: string | null;
  declineReason?: string | null;
}

export interface DeclineSupplierLeadRequest {
  reason: string;
}

const BASE = "/api/v1/suppliers/me/leads";

function queryString(params: Record<string, string | number | undefined | null>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

export const supplierLeadsApi = {
  list: (params: { status?: SupplierLeadStatusFilter; cursor?: string; limit?: number } = {}) =>
    apiFetch<SupplierLeadPage>(
      `${BASE}${queryString({
        status: params.status,
        cursor: params.cursor,
        limit: params.limit,
      })}`,
    ),

  get: (leadId: string) => apiFetch<SupplierLeadDetail>(`${BASE}/${encodeURIComponent(leadId)}`),

  view: (leadId: string, csrfToken: string) =>
    apiFetch<void>(`${BASE}/${encodeURIComponent(leadId)}/view`, { method: "POST" }, { csrfToken }),

  decline: (leadId: string, body: DeclineSupplierLeadRequest, csrfToken: string) =>
    apiFetch<void>(
      `${BASE}/${encodeURIComponent(leadId)}/decline`,
      { method: "POST", body: JSON.stringify(body) },
      { csrfToken },
    ),
};
