import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryNode, ProductListItem, SupplierDirectoryItem } from "@/lib/api/catalogue";
import type { ArticleSummary } from "@/lib/api/content";
import { categoryHref } from "@/lib/navigation/navigation";
import { formatMoney } from "@/lib/money";
import { LedgerSheet, LedgerRow } from "@/components/ui/desk-register";
import { Stamp } from "@/components/ui/status-pill";
import { buttonClassName } from "@/components/ui/button";
import { AddToListButton } from "./add-to-list-button";

/* Section heading in folio register — number first, then the page's purpose. */
export function LedgerSectionHead({
  folio,
  title,
  lede,
}: {
  folio: string;
  title: string;
  lede?: string;
}) {
  return (
    <div data-ledger-line className="mb-6">
      <p className="type-folio flex items-center gap-3 text-ink-muted">
        <span>{folio}</span>
        <span aria-hidden className="h-px flex-1 bg-line-strong" />
      </p>
      <h2 className="type-display-md mt-3 font-display text-ink">{title}</h2>
      {lede ? <p className="type-body mt-2 max-w-[62ch] text-ink-muted">{lede}</p> : null}
    </div>
  );
}

/** A captioned ledger plate — imagery admitted only as a specimen of a real
 *  department or process state, never as a fake supplier or project. */
export function LedgerPlate({
  src,
  alt,
  plateNo,
  caption,
}: {
  src: string;
  alt: string;
  plateNo: string;
  caption: string;
}) {
  return (
    <figure className="border border-line-strong bg-surface-elevated">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
      </div>
      <figcaption className="flex flex-wrap items-baseline gap-x-3 border-t border-line px-4 py-2.5">
        <span className="type-folio text-ink">{plateNo}</span>
        <span className="type-meta">{caption}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ Index */
export async function DepartmentIndex({
  locale,
  departments,
}: {
  locale: string;
  departments: CategoryNode[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <LedgerSheet folio={t("index.folio")} title={t("index.title")} meta={t("index.meta", { count: departments.length })}>
      {departments.map((department, index) => (
        <LedgerRow
          key={department.slug}
          entryNo={String(index + 1).padStart(2, "0")}
          action={
            <ArrowUpRight className="size-4 text-ink-muted" aria-hidden />
          }
        >
          <Link
            href={categoryHref(department.slug)}
            className="type-body font-semibold text-ink underline-offset-2 hover:underline"
          >
            {department.name}
          </Link>
          <p className="type-meta mt-0.5">
            {t("index.subcategories", { count: department.children.length })}
            {department.children.length > 0
              ? ` — ${department.children.slice(0, 4).map((child) => child.name).join(" · ")}`
              : ""}
          </p>
        </LedgerRow>
      ))}
    </LedgerSheet>
  );
}

/* --------------------------------------------------------------- Register */
export async function ProductRegister({
  locale,
  items,
}: {
  locale: string;
  items: ProductListItem[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });

  return (
    <LedgerSheet
      folio={t("register.folio")}
      title={t("register.title")}
      meta={
        <Link href="/products?sort=newest" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
          {t("register.viewAll")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {items.map((item, index) => (
        <div key={item.publicId} data-ledger-line>
          <LedgerRow
            entryNo={String(index + 1).padStart(3, "0")}
            stamp={
              <Stamp
                tone={
                  item.stockState === "InStock"
                    ? "success"
                    : item.stockState === "OutOfStock"
                      ? "danger"
                      : "warning"
                }
              >
                {tCat.has(`stock.${item.stockState}`) ? tCat(`stock.${item.stockState}`) : item.stockState}
              </Stamp>
            }
            action={<AddToListButton product={item} compact />}
          >
            <Link href={`/products/${item.slug}`} className="type-body-sm font-semibold text-ink underline-offset-2 hover:underline">
              {item.name}
            </Link>
            <p className="type-ledger-data mt-1 break-words text-ink-muted">
              {item.sku} · {item.supplier.name}
              {item.supplier.district ? ` · ${item.supplier.district}` : ""}
            </p>
            <p className="type-ledger-data mt-1 text-ink">
              {item.price?.state === "Public" && typeof item.price.amount === "number"
                ? formatMoney({ amount: item.price.amount, currency: item.price.currency, locale })
                : tProduct("priceOnRequest")}
              {item.price?.unitName ? <span className="text-ink-muted"> / {item.price.unitName}</span> : null}
              {item.minOrderQuantity ? (
                <span className="text-ink-muted"> · {t("register.moq", { count: item.minOrderQuantity })}</span>
              ) : null}
              {item.leadTimeDays ? (
                <span className="text-ink-muted"> · {t("register.lead", { count: item.leadTimeDays })}</span>
              ) : null}
            </p>
          </LedgerRow>
        </div>
      ))}
    </LedgerSheet>
  );
}

/* --------------------------------------------------------------- Workflow */
export interface WorkflowStep {
  state: string;
  title: string;
  body: string;
}

export async function WorkflowStates({
  locale,
  steps,
  example,
}: {
  locale: string;
  steps: WorkflowStep[];
  example: {
    title: string;
    note: string;
    item: string;
    supplierHeader: string;
    unitPriceHeader: string;
    leadTimeHeader: string;
    totalHeader: string;
    rows: { supplier: string; unitPrice: string; leadTime: string; total: string }[];
  };
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <ol className="border border-line-strong bg-surface-elevated">
        {steps.map((step, index) => (
          <li
            key={step.state}
            data-ledger-line
            className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 border-b border-line px-4 py-4 last:border-b-0 sm:px-5"
          >
            <span className="type-entry-no pt-1 text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <Stamp tone={index === 0 ? "neutral" : index === steps.length - 1 ? "success" : "warning"}>
                {step.state}
              </Stamp>
              <h3 className="type-title-sm mt-2 text-ink">{step.title}</h3>
              <p className="type-body-sm mt-1 text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Returns sheet — figures are illustrative until real returns arrive. */}
      <div className="self-start">
        <LedgerSheet folio={t("workflow.exampleFolio")} title={example.title}>
          <div className="px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <Stamp tone="neutral">{t("workflow.exampleStamp")}</Stamp>
              <p className="type-meta">{example.note}</p>
            </div>
            <p className="type-body-sm mt-3 font-semibold text-ink">{example.item}</p>
            <table className="mt-3 w-full border-t border-line">
              <thead>
                <tr className="type-folio text-left text-ink-muted">
                  <th className="py-2 pr-2 font-medium">{example.supplierHeader}</th>
                  <th className="py-2 pr-2 font-medium">{example.unitPriceHeader}</th>
                  <th className="py-2 pr-2 font-medium">{example.leadTimeHeader}</th>
                  <th className="py-2 text-right font-medium">{example.totalHeader}</th>
                </tr>
              </thead>
              <tbody>
                {example.rows.map((row) => (
                  <tr key={row.supplier} className="type-ledger-data border-t border-line text-ink">
                    <td className="py-2 pr-2">{row.supplier}</td>
                    <td className="py-2 pr-2">{row.unitPrice}</td>
                    <td className="py-2 pr-2">{row.leadTime}</td>
                    <td className="py-2 text-right">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LedgerSheet>
        <div className="mt-6">
          <LedgerPlate
            src="/home/home-buyer-desk.jpg"
            alt={t("workflow.plateAlt")}
            plateNo={t("workflow.plateNo")}
            caption={t("workflow.plateCaption")}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Supplier desk */
export async function SupplierDesk({
  locale,
  suppliers,
}: {
  locale: string;
  suppliers: SupplierDirectoryItem[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <LedgerSheet folio={t("supplierDesk.folio")} title={t("supplierDesk.title")} meta={t("supplierDesk.meta", { count: suppliers.length })}>
        {suppliers.map((supplier, index) => (
          <LedgerRow
            key={supplier.publicId}
            entryNo={String(index + 1).padStart(2, "0")}
            stamp={
              supplier.verified ? <Stamp tone="success">{t("supplierDesk.verified")}</Stamp> : undefined
            }
            action={
              <Link
                href={`/suppliers/${supplier.slug}`}
                className="inline-flex items-center gap-1 type-label text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                {t("supplierDesk.profile")}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            }
          >
            <p className="type-body-sm font-semibold text-ink">{supplier.name}</p>
            <p className="type-ledger-data mt-1 break-words text-ink-muted">
              {supplier.district ?? supplier.location ?? t("supplierDesk.locationPending")}
              {typeof supplier.productCount === "number"
                ? ` · ${t("supplierDesk.products", { count: supplier.productCount })}`
                : ""}
            </p>
          </LedgerRow>
        ))}
      </LedgerSheet>

      <div className="self-start">
        <LedgerPlate
          src="/home/home-supplier-yard.jpg"
          alt={t("supplierDesk.plateAlt")}
          plateNo={t("supplierDesk.plateNo")}
          caption={t("supplierDesk.plateCaption")}
        />
        <div className="mt-6 border border-line-strong bg-surface-elevated px-5 py-5">
          <span className="type-folio text-ink-muted">{t("supplierDesk.tabFolio")}</span>
          <h3 className="type-title-md mt-2 text-ink">{t("supplierDesk.tabTitle")}</h3>
          <p className="type-body-sm mt-2 text-ink-muted">{t("supplierDesk.tabBody")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClassName({ variant: "primary", size: "md" })}>
              {t("supplierDesk.tabCta")}
            </Link>
            <Link href="/pricing" className={buttonClassName({ variant: "secondary", size: "md" })}>
              {t("supplierDesk.pricingCta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Annex */
export async function FieldNotes({
  locale,
  articles,
}: {
  locale: string;
  articles: ArticleSummary[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <LedgerSheet
      folio={t("annex.folio")}
      title={t("annex.title")}
      meta={
        <Link href="/news" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-2 hover:underline">
          {t("annex.viewAll")}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {articles.map((article, index) => (
        <LedgerRow key={article.publicId} entryNo={String(index + 1).padStart(2, "0")}>
          <Link href={`/news/post/${encodeURIComponent(article.slug)}`} className="type-body-sm font-semibold text-ink underline-offset-2 hover:underline">
            {article.title}
          </Link>
          <p className="type-ledger-data mt-1 break-words text-ink-muted">
            {article.kind}
            {article.publishedAt
              ? ` · ${new Date(article.publishedAt).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}`
              : ""}
          </p>
          {article.excerpt ? <p className="type-body-sm mt-1 line-clamp-2 text-ink-muted">{article.excerpt}</p> : null}
        </LedgerRow>
      ))}
    </LedgerSheet>
  );
}

/* ----------------------------------------------------------- Closing entry */
export async function ClosingEntry({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <section className="border border-ink bg-surface-inverse px-5 py-8 sm:px-8" data-surface="dark">
      <p className="type-folio flex items-center gap-3 text-ink-inverse/70">
        <span>{t("closing.folio")}</span>
        <span aria-hidden className="h-px flex-1 bg-ink-inverse/30" />
        <span>{t("closing.state")}</span>
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[56ch]">
          <h2 className="type-display-md font-display text-ink-inverse">{t("closing.title")}</h2>
          <p className="type-body mt-2 text-ink-inverse/80">{t("closing.lede")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#materials-list" className={buttonClassName({ variant: "primary", size: "lg" })}>
            {t("closing.startCta")}
          </a>
          <Link href="/suppliers" className={buttonClassName({ variant: "secondary", size: "lg" })}>
            {t("closing.suppliersCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
