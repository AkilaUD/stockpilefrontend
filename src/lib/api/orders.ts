import { apiFetch } from "./client";

/** Order list/detail (api.md §2.10) — mirrors `OrderContracts`. */

export interface OrderSummary {
  publicId: string;
  orderNumber: string;
  quoteId: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  buyerName: string;
  status: string;
  grandTotal: number;
  currency: string;
  stockReservationState: string;
  createdAt: string;
}

export interface OrderItem {
  lineNumber: number;
  productId?: string | null;
  productName: string;
  sku?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  stockState: string;
}

export interface OrderStatusEntry {
  from: string;
  to: string;
  occurredAt: string;
  reason?: string | null;
}

export interface OrderDetail extends OrderSummary {
  quoteNumber: string;
  quoteRevisionNumber: number;
  subtotal: number;
  discountTotal: number;
  deliveryCost: number;
  taxAmount: number;
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  deliveryLocationText?: string | null;
  requestedDeliveryAt?: string | null;
  confirmedAt?: string | null;
  acknowledgedAt?: string | null;
  items: OrderItem[];
  history: OrderStatusEntry[];
}

export const ordersApi = {
  listMine: () => apiFetch<OrderSummary[]>("/api/v1/me/orders"),
  listSupplier: () => apiFetch<OrderSummary[]>("/api/v1/suppliers/me/orders"),
  get: (orderId: string) =>
    apiFetch<OrderDetail>(`/api/v1/orders/${encodeURIComponent(orderId)}`),
  acknowledge: (
    orderId: string,
    csrfToken: string,
    idempotencyKey: string = crypto.randomUUID(),
  ) =>
    apiFetch<OrderDetail>(
      `/api/v1/orders/${encodeURIComponent(orderId)}/acknowledge`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      },
      { csrfToken },
    ),
};
