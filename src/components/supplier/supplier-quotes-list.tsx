"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { DeskList, DeskRow } from "@/components/ui/desk-register";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { quotesApi, resolveErrorCopy, type QuoteSummary } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { quoteStatusTone } from "@/lib/procurement/status-tone";
import { Can } from "@/components/workspace/permission-gate";
import { Permissions } from "@/lib/auth/permissions";

export function SupplierQuotesList() {
  const t = useTranslations("supplier.quotesList");
  const tErrors = useTranslations("errors");
  const { csrfToken } = useSession();
  const [items, setItems] = useState<QuoteSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await quotesApi.listMineSupplier();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  async function onWithdraw(quoteId: string) {
    setBusyId(quoteId);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      await quotesApi.withdraw(quoteId, token);
      setItems((prev) =>
        prev.map((q) => (q.publicId === quoteId ? { ...q, status: "Withdrawn" } : q)),
      );
    } catch (err) {
      setError(resolveErrorCopy(tErrors, err));
    } finally {
      setBusyId(null);
    }
  }

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

  const canWithdraw = (status: string) => status !== "Withdrawn" && status !== "Accepted";

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="type-body-sm text-danger">
          {error}
        </p>
      )}
      <DeskList>
        {items.map((quote) => (
          <DeskRow
            key={quote.publicId}
            status={<StatusPill tone={quoteStatusTone(quote.status)}>{quote.status}</StatusPill>}
            actions={
              canWithdraw(quote.status) ? (
                <Can permission={Permissions.QuoteWithdraw}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busyId === quote.publicId}
                  onClick={() => void onWithdraw(quote.publicId)}
                >
                  {t("withdraw")}
                </Button>
                </Can>
              ) : null
            }
          >
            <p className="type-title-sm text-ink">{quote.rfqTitle}</p>
            <p className="type-meta text-ink-muted">
              {quote.quoteNumber} · rev {quote.revisionNumber} ·{" "}
              {formatMoney({ amount: quote.grandTotal, currency: quote.currency, locale: "en" })}
            </p>
          </DeskRow>
        ))}
      </DeskList>
    </div>
  );
}
