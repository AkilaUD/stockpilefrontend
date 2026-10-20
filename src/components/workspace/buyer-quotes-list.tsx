"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GitCompareArrows } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { DeskList, DeskRow } from "@/components/ui/desk-register";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { quotesApi, resolveErrorCopy, type QuoteSummary } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { quoteStatusTone } from "@/lib/procurement/status-tone";
import { Can } from "@/components/workspace/permission-gate";
import { Permissions } from "@/lib/auth/permissions";

export function BuyerQuotesList() {
  const t = useTranslations("workspace.quotes");
  const tErrors = useTranslations("errors");
  const { csrfToken } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<QuoteSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await quotesApi.listMineBuyer();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tErrors]);

  async function onAccept(quoteId: string) {
    setBusyId(quoteId);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      const order = await quotesApi.accept(quoteId, token);
      router.push(`/workspace/orders/${order.orderId}`);
    } catch (err) {
      setError(resolveErrorCopy(tErrors, err));
    } finally {
      setBusyId(null);
    }
  }

  async function onDecline(quoteId: string) {
    if (!declineReason.trim()) return;
    setBusyId(quoteId);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      await quotesApi.decline(quoteId, declineReason.trim(), token);
      setItems((prev) => prev.map((q) => (q.publicId === quoteId ? { ...q, status: "Declined" } : q)));
      setDeclineId(null);
      setDeclineReason("");
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

  const actionable = (status: string) => status === "Submitted" || status === "UnderReview";

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
              actionable(quote.status) ? (
                <>
                  <Can permission={Permissions.QuoteAccept}>
                    <Button type="button" size="sm" disabled={busyId === quote.publicId} onClick={() => void onAccept(quote.publicId)}>
                      {t("accept")}
                    </Button>
                  </Can>
                  <Can permission={Permissions.QuoteDecline}>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setDeclineId(quote.publicId)}>
                      {t("decline")}
                    </Button>
                  </Can>
                </>
              ) : null
            }
          >
            <p className="type-title-sm text-ink">{quote.rfqTitle}</p>
            <p className="type-meta text-ink-muted">
              {quote.quoteNumber} · {quote.supplierName} ·{" "}
              {formatMoney({ amount: quote.grandTotal, currency: quote.currency, locale: "en" })}
            </p>
            <Link
              href={`/workspace/rfqs/${quote.rfqId}/comparison`}
              className="type-meta mt-1 inline-flex items-center gap-1 text-ink-accent hover:text-ink"
            >
              <GitCompareArrows className="size-3.5 shrink-0" aria-hidden />
              {t("compare")}
            </Link>
          </DeskRow>
        ))}
      </DeskList>

      {declineId && (
        <div className="rounded-md border border-line bg-surface-panel p-4" role="dialog">
          <h2 className="type-title-sm text-ink">{t("declineTitle")}</h2>
          <FormField id="decline-reason" label={t("declineReason")} className="mt-4">
            {(control) => (
              <textarea
                {...control}
                className={fieldControlClassName}
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            )}
          </FormField>
          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              disabled={!declineReason.trim() || busyId === declineId}
              onClick={() => void onDecline(declineId)}
            >
              {t("declineConfirm")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDeclineId(null)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
