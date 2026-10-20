"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { ordersApi, resolveErrorCopy, type OrderDetail } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { Permissions, hasPermission } from "@/lib/auth/permissions";

export function OrderDetailView({
  orderId,
  backHref,
  canAcknowledge = false,
}: {
  orderId: string;
  backHref: string;
  canAcknowledge?: boolean;
}) {
  const t = useTranslations("workspace.orders");
  const tErrors = useTranslations("errors");
  const { csrfToken, user } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await ordersApi.get(orderId);
        if (!cancelled) setOrder(detail);
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, tErrors]);

  async function onAcknowledge() {
    setBusy(true);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      const updated = await ordersApi.acknowledge(orderId, token);
      setOrder(updated);
    } catch (err) {
      setError(resolveErrorCopy(tErrors, err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) {
    return (
      <p role="alert" className="type-body text-danger">
        {error}
      </p>
    );
  }

  if (!order) {
    return <p className="type-body text-ink-muted">{t("loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <nav className="type-meta">
        <Link href={backHref} className="text-ink-muted hover:text-ink">
          {t("title")}
        </Link>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{order.orderNumber}</h1>
          <p className="mt-2 type-body text-ink-muted">
            {order.supplierName} · {order.buyerName}
          </p>
          <p className="mt-1 type-title-sm text-ink">
            {formatMoney({ amount: order.grandTotal, currency: order.currency, locale: "en" })}
          </p>
        </div>
        <StatusPill tone="neutral">{order.status}</StatusPill>
      </header>

      {error && (
        <p role="alert" className="type-body text-danger">
          {error}
        </p>
      )}

      {canAcknowledge && hasPermission(user, Permissions.OrderFulfill) && order.status === "Confirmed" && (
        <Button type="button" disabled={busy} onClick={() => void onAcknowledge()}>
          {t("acknowledge")}
        </Button>
      )}

      <section>
        <h2 className="block-title">{t("linesTitle")}</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.lineNumber} className="flex flex-wrap justify-between gap-2 py-3">
              <span>
                <span className="type-body font-medium text-ink">
                  {item.lineNumber}. {item.productName || item.description}
                </span>
                <span className="mt-1 block type-meta text-ink-muted">
                  {item.quantity} × {formatMoney({ amount: item.unitPrice, currency: order.currency, locale: "en" })}
                </span>
              </span>
              <span className="type-meta font-mono text-ink">
                {formatMoney({ amount: item.lineTotal, currency: order.currency, locale: "en" })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
