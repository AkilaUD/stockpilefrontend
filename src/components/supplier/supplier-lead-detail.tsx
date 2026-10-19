"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { resolveErrorCopy, supplierLeadsApi, type SupplierLeadDetail } from "@/lib/api";

export function SupplierLeadDetailView({ leadId }: { leadId: string }) {
  const t = useTranslations("supplier.leads");
  const tErrors = useTranslations("errors");
  const { csrfToken } = useSession();
  const router = useRouter();
  const [lead, setLead] = useState<SupplierLeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await supplierLeadsApi.get(leadId);
        if (cancelled) return;
        setLead(detail);
        const token = await csrfToken();
        if (token && !detail.viewedAt) {
          try {
            await supplierLeadsApi.view(leadId, token);
          } catch {
            /* view is best-effort; detail still renders */
          }
        }
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, csrfToken, tErrors]);

  async function onDecline() {
    if (!declineReason.trim()) return;
    setBusy(true);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      await supplierLeadsApi.decline(leadId, { reason: declineReason.trim() }, token);
      router.push("/supplier/leads");
    } catch (err) {
      setError(resolveErrorCopy(tErrors, err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !lead) {
    return (
      <p role="alert" className="type-body text-danger">
        {error}
      </p>
    );
  }

  if (!lead) {
    return <p className="type-body text-ink-muted">{t("loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <nav className="type-meta">
        <Link href="/supplier/leads" className="text-ink-muted hover:text-ink">
          {t("title")}
        </Link>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink">{lead.referenceCode}</span>
      </nav>

      <header>
        <h1 className="page-title">{lead.title}</h1>
        <p className="mt-2 type-body text-ink-muted">
          {lead.referenceCode}
          {lead.respondBy ? ` · ${t("respondBy", { date: lead.respondBy })}` : null}
        </p>
        {lead.deliveryLocationText && (
          <p className="mt-1 type-body-sm text-ink-muted">{lead.deliveryLocationText}</p>
        )}
        {lead.buyerNotes && <p className="mt-3 type-body text-ink">{lead.buyerNotes}</p>}
      </header>

      <section>
        <h2 className="block-title">{t("linesTitle")}</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {lead.lines.map((line) => (
            <li key={line.rfqItemId} className="flex flex-wrap justify-between gap-2 py-3">
              <span>
                <span className="type-body font-medium text-ink">
                  {line.lineNumber}. {line.description}
                </span>
                {line.specification && (
                  <span className="mt-1 block type-body-sm text-ink-muted">{line.specification}</span>
                )}
              </span>
              <span className="type-meta font-mono text-ink-muted">
                {line.quantity}
                {line.unitCode ? ` ${line.unitCode}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p role="alert" className="type-body text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/supplier/leads/${lead.leadId}/quote`}>{t("quoteCta")}</ButtonLink>
        <Button type="button" variant="secondary" onClick={() => setDeclineOpen(true)}>
          {t("declineCta")}
        </Button>
      </div>

      {declineOpen && (
        <div
          className="rounded-md border border-line bg-surface-panel p-5"
          role="dialog"
          aria-labelledby="decline-title"
        >
          <h2 id="decline-title" className="type-title-md text-ink">
            {t("declineTitle")}
          </h2>
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
            <Button type="button" onClick={() => void onDecline()} disabled={busy || !declineReason.trim()}>
              {t("declineConfirm")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDeclineOpen(false)}>
              {t("declineCancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
