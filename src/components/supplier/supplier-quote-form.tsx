"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import {
  quotesApi,
  resolveErrorCopy,
  supplierLeadsApi,
  type CreateQuoteItemRequest,
  type SupplierLeadDetail,
} from "@/lib/api";

interface LinePrice {
  rfqItemId: string;
  quantity: number;
  unitPrice: string;
}

export function SupplierQuoteForm({ leadId }: { leadId: string }) {
  const t = useTranslations("supplier.quotes");
  const tLeads = useTranslations("supplier.leads");
  const tErrors = useTranslations("errors");
  const { csrfToken } = useSession();
  const router = useRouter();
  const [lead, setLead] = useState<SupplierLeadDetail | null>(null);
  const [lines, setLines] = useState<LinePrice[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [validityDays, setValidityDays] = useState("14");
  const [leadTimeDays, setLeadTimeDays] = useState("7");
  const [deliveryCost, setDeliveryCost] = useState("0");
  const [supplierNote, setSupplierNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await supplierLeadsApi.get(leadId);
        if (cancelled) return;
        setLead(detail);
        setLines(
          detail.lines.map((line) => ({
            rfqItemId: line.rfqItemId,
            quantity: line.quantity,
            unitPrice: "",
          })),
        );
      } catch (err) {
        if (!cancelled) setError(resolveErrorCopy(tErrors, err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, tErrors]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!lead) return;
    setBusy(true);
    setError(null);
    try {
      const items: CreateQuoteItemRequest[] = lines.map((line) => ({
        rfqItemId: line.rfqItemId,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
      }));
      if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
        setError(t("invalidPrice"));
        setBusy(false);
        return;
      }
      const token = await csrfToken();
      if (!token) throw new Error("csrf");
      await quotesApi.submit(
        {
          rfqMatchId: lead.leadId,
          coverage: "Full",
          currency,
          leadTimeDays: Number(leadTimeDays) || undefined,
          validityDays: Number(validityDays) || undefined,
          deliveryCost: Number(deliveryCost) || 0,
          taxState: "TaxExcluded",
          supplierNote: supplierNote.trim() || undefined,
          items,
        },
        token,
      );
      router.push(`/supplier/leads/${leadId}`);
    } catch (err) {
      setError(resolveErrorCopy(tErrors, err));
    } finally {
      setBusy(false);
    }
  }

  if (!lead && !error) {
    return <p className="type-body text-ink-muted">{tLeads("loading")}</p>;
  }

  if (!lead) {
    return (
      <p role="alert" className="type-body text-danger">
        {error}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <nav className="type-meta">
        <Link
          href={`/supplier/leads/${leadId}`}
          className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5 shrink-0" aria-hidden />
          {lead.referenceCode}
        </Link>
        <span className="mx-2 text-ink-faint">/</span>
        <span className="text-ink">{t("title")}</span>
      </nav>

      <header className="border-b border-line pb-4">
        <h1 className="type-title-md text-ink">{t("title")}</h1>
        <p className="mt-1 type-meta text-ink-muted">{lead.title}</p>
      </header>

      <section className="space-y-3 rounded-md border border-line bg-surface-panel p-4">
        <h2 className="type-label text-ink-muted">{t("linesTitle")}</h2>
        {lead.lines.map((line, index) => (
          <div key={line.rfqItemId} className="grid gap-3 border-b border-line pb-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <p className="type-body font-medium text-ink">
                {line.lineNumber}. {line.description}
              </p>
              <p className="type-meta text-ink-muted">
                {t("qty", { quantity: line.quantity, unit: line.unitCode ?? "" })}
              </p>
            </div>
            <FormField id={`price-${line.rfqItemId}`} label={t("unitPrice")} required>
              {(control) => (
                <input
                  {...control}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={fieldControlClassName}
                  value={lines[index]?.unitPrice ?? ""}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...next[index]!, unitPrice: e.target.value };
                    setLines(next);
                  }}
                />
              )}
            </FormField>
          </div>
        ))}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="currency" label={t("currency")} required>
          {(control) => (
            <input
              {...control}
              className={fieldControlClassName}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          )}
        </FormField>
        <FormField id="validity" label={t("validityDays")} required>
          {(control) => (
            <input
              {...control}
              type="number"
              min="1"
              className={fieldControlClassName}
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              required
            />
          )}
        </FormField>
        <FormField id="lead-time" label={t("leadTimeDays")}>
          {(control) => (
            <input
              {...control}
              type="number"
              min="0"
              className={fieldControlClassName}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
            />
          )}
        </FormField>
        <FormField id="delivery" label={t("deliveryCost")}>
          {(control) => (
            <input
              {...control}
              type="number"
              min="0"
              step="0.01"
              className={fieldControlClassName}
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(e.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField id="note" label={t("supplierNote")}>
        {(control) => (
          <textarea
            {...control}
            className={fieldControlClassName}
            rows={3}
            value={supplierNote}
            onChange={(e) => setSupplierNote(e.target.value)}
          />
        )}
      </FormField>

      {error && (
        <p role="alert" className="type-body text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
