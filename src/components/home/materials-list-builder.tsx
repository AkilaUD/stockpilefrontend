"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Copy, ListPlus, Plus, Search, Send, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchCommandSearch, type ProductListItem } from "@/lib/api/catalogue";
import { formatMoney } from "@/lib/money";
import {
  computeSubtotal,
  materialsListStore,
  type LedgerLine,
} from "@/lib/procurement/materials-list";
import { LedgerSheet, LedgerTotals } from "@/components/ui/desk-register";
import { buttonClassName } from "@/components/ui/button";
import { cx } from "@/lib/cx";

export interface BuilderOption {
  value: string;
  label: string;
}

const inputClass =
  "w-full border border-line-strong bg-surface-elevated px-2 py-1.5 type-body-sm text-ink outline-none focus:border-ink";

/**
 * The visitor's working page of the ledger. Lines come from the cover sheet,
 * the register, live search, or a blank line; the list persists on this
 * device and carries into the RFQ form. Nothing here claims an RFQ exists —
 * that only becomes true after the authenticated submit on /rfq.
 */
export function MaterialsListBuilder({
  departments,
  units,
}: {
  departments: BuilderOption[];
  units: BuilderOption[];
}) {
  const t = useTranslations("home.ledger");
  const tProduct = useTranslations("catalogue.product");
  const locale = useLocale();
  const lines = useSyncExternalStore(
    materialsListStore.subscribe,
    materialsListStore.getSnapshot,
    materialsListStore.getServerSnapshot,
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductListItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const handle = window.setTimeout(() => {
      setSearching(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchCommandSearch(trimmed, controller.signal)
        .then((response) => {
          setResults(response.products.slice(0, 6));
          setSearching(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
            setSearching(false);
          }
        });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const subtotal = computeSubtotal(lines);
  const subtotalNote = [
    subtotal.porLines > 0 ? t("builder.porExcluded", { count: subtotal.porLines }) : null,
    subtotal.awaitingQuantity > 0 ? t("builder.awaitingQty", { count: subtotal.awaitingQuantity }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section id="materials-list" className="scroll-mt-24">
      <LedgerSheet
        folio={t("builder.folio")}
        title={t("builder.title")}
        meta={t("builder.meta", { count: lines.length })}
        footer={
          <div className="flex flex-col gap-3">
            <LedgerTotals
              label={t("builder.subtotal")}
              note={subtotalNote || undefined}
              value={
                subtotal.pricedLines > 0
                  ? formatMoney({ amount: subtotal.amount, currency: subtotal.currency, locale })
                  : "—"
              }
            />
            <p className="type-meta">{t("builder.subtotalNote")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/rfq" className={buttonClassName({ variant: "primary", size: "lg" })}>
                <Send className="size-4" aria-hidden />
                {t("builder.sendCta")}
              </Link>
              {lines.length > 0 ? (
                <button
                  type="button"
                  onClick={() => materialsListStore.clear()}
                  className="type-body-sm font-semibold text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-danger"
                >
                  {t("builder.clear")}
                </button>
              ) : null}
              <span className="type-meta ml-auto">{t("builder.savedNote")}</span>
            </div>
          </div>
        }
      >
        {/* Live search → add */}
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <label htmlFor="ledger-search" className="type-folio text-ink-muted">
            {t("builder.searchLabel")}
          </label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              id="ledger-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (event.target.value.trim().length < 2) {
                  setResults(null);
                  setSearching(false);
                }
              }}
              placeholder={t("builder.searchPlaceholder")}
              autoComplete="off"
              className="h-11 w-full border border-line-strong bg-surface-elevated pr-3 pl-10 type-body text-ink outline-none placeholder:text-ink-muted focus:border-ink"
            />
          </div>
          {searching ? <p className="type-meta mt-2">{t("builder.searching")}</p> : null}
          {results !== null && !searching ? (
            results.length === 0 ? (
              <p className="type-meta mt-2">{t("builder.noResults")}</p>
            ) : (
              <ul className="mt-2 divide-y divide-line border border-line">
                {results.map((product) => (
                  <li key={product.publicId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    <span className="type-body-sm min-w-0 flex-1 font-semibold text-ink">{product.name}</span>
                    <span className="type-entry-no text-ink-muted">
                      {product.sku} · {product.supplier.name}
                    </span>
                    <span className="type-ledger-data text-ink">
                      {product.price?.state === "Public" && typeof product.price.amount === "number"
                        ? formatMoney({ amount: product.price.amount, currency: product.price.currency, locale })
                        : tProduct("priceOnRequest")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        materialsListStore.addProduct(product);
                        setQuery("");
                        setResults(null);
                      }}
                      aria-label={t("addNamed", { name: product.name })}
                      className="inline-flex items-center gap-1 border border-ink px-2 py-1 type-label text-ink transition-colors hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      {t("add")}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        {/* Lines */}
        {lines.length === 0 ? (
          <div className="px-4 py-8 sm:px-5">
            <p className="type-body-sm max-w-[60ch] text-ink-muted">{t("builder.empty")}</p>
            <button
              type="button"
              onClick={() => materialsListStore.addBlank()}
              className={cx(buttonClassName({ variant: "secondary", size: "md" }), "mt-4")}
            >
              <ListPlus className="size-4" aria-hidden />
              {t("builder.addBlank")}
            </button>
          </div>
        ) : (
          <>
            <div className="type-folio hidden grid-cols-[3.25rem_minmax(0,1fr)_7rem_9rem_9rem_auto] gap-x-3 border-b border-line px-5 py-2 text-ink-muted lg:grid">
              <span>{t("builder.colEntry")}</span>
              <span>{t("builder.colMaterial")}</span>
              <span>{t("builder.colQty")}</span>
              <span>{t("builder.colUnit")}</span>
              <span>{t("builder.colCategory")}</span>
              <span className="sr-only">{t("builder.colActions")}</span>
            </div>
            <ul>
              {lines.map((line, index) => (
                <LedgerLineRow
                  key={line.key}
                  line={line}
                  index={index}
                  departments={departments}
                  units={units}
                  locale={locale}
                />
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => materialsListStore.addBlank()}
                className="inline-flex items-center gap-1.5 type-body-sm font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                <ListPlus className="size-4" aria-hidden />
                {t("builder.addBlank")}
              </button>
            </div>
          </>
        )}
      </LedgerSheet>
      <p className="type-meta mt-3">{t("builder.honestyNote")}</p>
    </section>
  );
}

function LedgerLineRow({
  line,
  index,
  departments,
  units,
  locale,
}: {
  line: LedgerLine;
  index: number;
  departments: BuilderOption[];
  units: BuilderOption[];
  locale: string;
}) {
  const t = useTranslations("home.ledger");
  const tActions = useTranslations("common.actions");
  const update = (patch: Partial<LedgerLine>) => materialsListStore.update(line.key, patch);
  const lineTotal =
    line.priceState === "Public" &&
    typeof line.priceAmount === "number" &&
    Number(line.quantity) > 0
      ? formatMoney({ amount: line.priceAmount * Number(line.quantity), currency: line.priceCurrency ?? "LKR", locale })
      : null;

  return (
    <li
      data-ledger-line
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5 lg:grid-cols-[3.25rem_minmax(0,1fr)_7rem_9rem_9rem_auto] lg:items-start"
    >
      <span className="type-entry-no pt-2 text-ink-muted">{String(index + 1).padStart(3, "0")}</span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <input
          aria-label={t("builder.colMaterial")}
          value={line.description}
          onChange={(event) => update({ description: event.target.value })}
          placeholder={t("builder.descriptionPlaceholder")}
          className={inputClass}
        />
        <input
          aria-label={t("builder.specification")}
          value={line.specification}
          onChange={(event) => update({ specification: event.target.value })}
          placeholder={t("builder.specificationPlaceholder")}
          className={inputClass}
        />
        <p className="type-ledger-data break-words text-ink-muted">
          {line.sku ? `${line.sku} · ` : ""}
          {line.supplierName ?? ""}
          {lineTotal ? ` · ${lineTotal}` : ""}
        </p>
      </div>
      <div className="col-start-2 mt-2 flex gap-2 lg:col-start-auto lg:mt-0 lg:contents">
        <input
          aria-label={t("builder.colQty")}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={line.quantity}
          onChange={(event) => update({ quantity: event.target.value })}
          className={cx(inputClass, "w-24 lg:w-full")}
        />
        <select
          aria-label={t("builder.colUnit")}
          value={line.unitOfMeasureCode}
          onChange={(event) => update({ unitOfMeasureCode: event.target.value })}
          className={cx(inputClass, "w-32 lg:w-full")}
        >
          <option value="">—</option>
          {units.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
        <select
          aria-label={t("builder.colCategory")}
          value={line.categorySlug}
          onChange={(event) => update({ categorySlug: event.target.value })}
          className={cx(inputClass, "w-36 lg:w-full")}
        >
          <option value="">—</option>
          {departments.map((department) => (
            <option key={department.value} value={department.value}>
              {department.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-start-2 mt-2 flex gap-1 lg:col-start-auto lg:mt-0">
        <button
          type="button"
          onClick={() => materialsListStore.duplicate(line.key)}
          aria-label={t("builder.duplicate")}
          title={t("builder.duplicate")}
          className="border border-line-strong p-1.5 text-ink transition-colors hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Copy className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => materialsListStore.remove(line.key)}
          aria-label={`${tActions("remove")} — ${line.description || index + 1}`}
          title={tActions("remove")}
          className="border border-line-strong p-1.5 text-ink transition-colors hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
