"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";
import { DeskList, DeskRowLink } from "@/components/ui/desk-register";
import { StatusPill } from "@/components/ui/status-pill";
import { ordersApi, resolveErrorCopy, type OrderSummary } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { orderStatusTone } from "@/lib/procurement/status-tone";

export function BuyerOrdersList() {
  const t = useTranslations("workspace.orders");
  const tErrors = useTranslations("errors");
  const [items, setItems] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await ordersApi.listMine();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  if (error && items.length === 0) {
    return (
      <p role="alert" className="type-body-sm text-danger">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return <EmptyState title={t("emptyTitle")} description={t("emptyBody")} headingLevel="h2" />;
  }

  return (
    <DeskList>
      {items.map((order) => (
        <DeskRowLink
          key={order.publicId}
          href={`/workspace/orders/${order.publicId}`}
          status={<StatusPill tone={orderStatusTone(order.status)}>{order.status}</StatusPill>}
        >
          <p className="type-title-sm text-ink">{order.orderNumber}</p>
          <p className="type-meta text-ink-muted">
            {order.supplierName} ·{" "}
            {formatMoney({ amount: order.grandTotal, currency: order.currency, locale: "en" })}
          </p>
        </DeskRowLink>
      ))}
    </DeskList>
  );
}
