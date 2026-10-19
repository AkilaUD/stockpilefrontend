import { apiFetch } from "./client";

/** Subscription plans + supplier subscribe (api.md §2.10 / Phase 6). */

export interface Entitlement {
  key: string;
  limit?: number | null;
  unlimited: boolean;
  value?: string | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceAmount?: number | null;
  currency: string;
  billingPeriod: string;
  isSalesAssisted: boolean;
  isActive: boolean;
  sortOrder: number;
  entitlements: Entitlement[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  amount: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string | null;
  externalRef?: string | null;
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string | null;
  autoRenew: boolean;
  entitled: boolean;
  invoices: Invoice[];
}

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  provider: string;
  providerRef: string;
  amount: number;
  currency: string;
  status: string;
  occurredAt: string;
  instructions?: string | null;
}

export const subscriptionsApi = {
  plans: () => apiFetch<Plan[]>("/api/v1/subscriptions/plans"),
  getMine: () =>
    apiFetch<{ subscription?: Subscription | null }>("/api/v1/suppliers/me/subscription"),
  subscribe: (
    planCode: string,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<Subscription>(
      "/api/v1/suppliers/me/subscription",
      {
        method: "POST",
        body: JSON.stringify({ planCode }),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),
  cancel: (
    reason: string | undefined,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<Subscription>(
      "/api/v1/suppliers/me/subscription/cancel",
      {
        method: "POST",
        body: JSON.stringify({ reason }),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),
  pay: (
    subscriptionId: string,
    invoiceId: string | undefined,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<PaymentResponse>(
      `/api/v1/subscriptions/${encodeURIComponent(subscriptionId)}/payments`,
      {
        method: "POST",
        body: JSON.stringify({ invoiceId }),
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),
};
