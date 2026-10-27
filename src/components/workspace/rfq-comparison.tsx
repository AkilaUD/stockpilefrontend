"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { quotesApi, resolveErrorCopy, type RfqComparisonResponse } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { quoteStatusTone } from "@/lib/procurement/status-tone";

export function RfqComparisonView({ rfqId }: { rfqId: string }) {
  const t = useTranslations("workspace.quotes");
  const tErrors = useTranslations("errors");
  const [data, setData] = useState<RfqComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const comparison = await quotesApi.comparison(rfqId);
        if (!cancelled) setData(comparison);
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rfqId, tErrors]);

  const lowestTotal = useMemo(() => {
    if (!data?.comparable || data.quotes.length < 2) return null;
    return data.quotes.reduce((min, quote) =>
      quote.totals.grandTotal < min ? quote.totals.grandTotal : min,
    data.quotes[0]!.totals.grandTotal);
  }, [data]);

  if (error) {
    return (
      <p role="alert" className="type-body-sm text-danger">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="type-meta text-ink-muted">{t("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <nav className="type-meta">
        <Link
          href="/workspace/quotes"
          className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
          {t("title")}
        </Link>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink">{data.rfqReference}</span>
      </nav>

      <header className="border-b border-line pb-4">
        <h1 className="type-title-md text-ink">{t("comparisonTitle")}</h1>
        <p className="mt-1 type-meta text-ink-muted">{data.rfqReference}</p>
      </header>

      {!data.comparable || data.quotes.length < 2 ? (
        <EmptyState
          title={t("comparisonEmptyTitle")}
          description={t("comparisonEmptyBody")}
          headingLevel="h2"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.quotes.map((quote) => {
            const isLowest = lowestTotal != null && quote.totals.grandTotal === lowestTotal;
            return (
              <li
                key={quote.quoteId}
                className={
                  isLowest
                    ? "rounded-lg border-2 border-brand-secondary bg-surface-panel p-4 shadow-elev-sm"
                    : "rounded-lg border border-line bg-surface-panel p-4"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <StatusPill tone={quoteStatusTone(quote.status)}>{quote.status}</StatusPill>
                  {isLowest && (
                    <span className="type-meta font-medium text-ink-accent">{t("comparisonLowest")}</span>
                  )}
                </div>
                <p className="mt-3 type-title-sm text-ink">{quote.supplierName}</p>
                <p className="type-meta text-ink-muted">{quote.quoteNumber}</p>
                <p className="type-title-md mt-2 tabular-nums text-ink">
                  {formatMoney({
                    amount: quote.totals.grandTotal,
                    currency: quote.totals.currency,
                    locale: "en",
                  })}
                </p>
                {quote.leadTimeDays != null && (
                  <p className="type-meta mt-1 inline-flex items-center gap-1 text-ink-muted">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    {t("leadTime", { days: quote.leadTimeDays })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
