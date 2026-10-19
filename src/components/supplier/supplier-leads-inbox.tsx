"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  resolveErrorCopy,
  supplierLeadsApi,
  type SupplierLeadStatusFilter,
  type SupplierLeadSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DeskList, DeskRowLink } from "@/components/ui/desk-register";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { leadStatusTone } from "@/lib/procurement/status-tone";

const TABS: SupplierLeadStatusFilter[] = [
  "new",
  "due_soon",
  "quoted",
  "negotiating",
  "won",
  "lost",
  "follow_up",
];

interface LeadPage {
  status: SupplierLeadStatusFilter;
  items: SupplierLeadSummary[];
  cursor: string | null;
  hasMore: boolean;
}

interface LeadError {
  status: SupplierLeadStatusFilter;
  message: string;
}

export function SupplierLeadsInbox() {
  const t = useTranslations("supplier.leads");
  const tErrors = useTranslations("errors");
  const [status, setStatus] = useState<SupplierLeadStatusFilter>("new");
  const [page, setPage] = useState<LeadPage | null>(null);
  const [error, setError] = useState<LeadError | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await supplierLeadsApi.list({ status, limit: 20 });
        if (cancelled) return;
        setPage({
          status,
          items: result.items,
          cursor: result.nextCursor ?? null,
          hasMore: result.hasMore,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) setError({ status, message: resolveErrorCopy(tErrors, err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, tErrors]);

  const current = page?.status === status ? page : null;
  const items = current?.items ?? [];
  const currentError = error?.status === status ? error : null;
  const loading = !current && !currentError;

  async function loadMore() {
    if (!current?.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await supplierLeadsApi.list({
        status,
        cursor: current.cursor ?? undefined,
        limit: 20,
      });
      setPage((prev) =>
        prev?.status === status
          ? {
              status,
              items: [...prev.items, ...result.items],
              cursor: result.nextCursor ?? null,
              hasMore: result.hasMore,
            }
          : prev,
      );
    } catch (err) {
      setError({ status, message: resolveErrorCopy(tErrors, err) });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={t("statusTabs")}
        className="flex flex-wrap gap-1.5 border-b border-line pb-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={status === tab}
            className={
              status === tab
                ? "type-meta rounded-sm bg-ink px-2.5 py-1 font-medium text-ink-inverse"
                : "type-meta rounded-sm border border-line px-2.5 py-1 text-ink-muted hover:border-ink hover:text-ink"
            }
            onClick={() => setStatus(tab)}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {currentError && (
        <p role="alert" className="type-body-sm text-danger">
          {currentError.message}
        </p>
      )}

      {!loading && items.length === 0 && !currentError && (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} headingLevel="h2" />
      )}

      {items.length > 0 && (
        <DeskList>
          {items.map((lead) => (
            <DeskRowLink
              key={lead.leadId}
              href={`/supplier/leads/${lead.leadId}`}
              status={<StatusPill tone={leadStatusTone(lead.status)}>{lead.status}</StatusPill>}
            >
              <p className="type-title-sm text-ink">{lead.title}</p>
              <p className="type-meta text-ink-muted">
                {lead.referenceCode} · {t("lineCount", { count: lead.lineCount })}
              </p>
            </DeskRowLink>
          ))}
        </DeskList>
      )}

      {(loading || loadingMore) && <p className="type-meta text-ink-muted">{t("loading")}</p>}

      {current?.hasMore && !loadingMore && (
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadMore()}>
          {t("loadMore")}
        </Button>
      )}
    </div>
  );
}
