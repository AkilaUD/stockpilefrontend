import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cx, type ClassValue } from "@/lib/cx";

/** Operational list — dense register, low chrome. */
export function DeskList({ children, className }: { children: ReactNode; className?: ClassValue }) {
  return <ul className={cx("divide-y divide-line border-y border-line", className)}>{children}</ul>;
}

interface DeskRowSlots {
  status: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: ClassValue;
}

const deskRowGrid = cx(
  "grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-3 gap-y-1.5 py-2.5 sm:items-center sm:py-3",
);

/** Status-first row: pill on the top row, body spans full width below. */
export function DeskRow({ status, children, actions, className }: DeskRowSlots) {
  return (
    <li className={cx(className)}>
      <div className={deskRowGrid}>
        <div className="col-start-1 row-start-1 self-center">{status}</div>
        {actions ? (
          <div className="col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-2 self-center">
            {actions}
          </div>
        ) : null}
        <div className="col-span-2 row-start-2 min-w-0">{children}</div>
      </div>
    </li>
  );
}

/** Interactive desk row — entire row is a link except explicit action slots. */
export function DeskRowLink({
  href,
  status,
  children,
  actions,
  className,
}: DeskRowSlots & { href: string }) {
  return (
    <li className={cx(className)}>
      <div className={cx(deskRowGrid, "group")}>
        <div className="col-start-1 row-start-1 self-center">{status}</div>
        {actions ? (
          <div className="col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-2 self-center">
            {actions}
          </div>
        ) : null}
        <Link
          href={href}
          className="col-span-2 row-start-2 min-w-0 rounded-sm transition-colors group-hover:text-ink-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {children}
        </Link>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------------------
   PanelSheet — structured data panel: header, rows and a totals foot.
   ------------------------------------------------------------------------ */
export function PanelSheet({
  folio,
  title,
  meta,
  children,
  footer,
  className,
}: {
  folio?: string;
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: ClassValue;
}) {
  return (
    <section className={cx("rounded-lg border border-line bg-surface-elevated shadow-elev-sm", className)}>
      {folio || title ? (
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-baseline gap-x-3">
            {folio ? <span className="type-label text-ink-muted">{folio}</span> : null}
            {title ? <h2 className="type-title-sm text-ink">{title}</h2> : null}
          </div>
          {meta ? <div className="type-meta">{meta}</div> : null}
        </header>
      ) : null}
      <div>{children}</div>
      {footer ? <footer className="border-t border-line px-4 py-3 sm:px-5">{footer}</footer> : null}
    </section>
  );
}

/** One panel row. Index, main entry, data cells, status/action. */
export function PanelRow({
  entryNo,
  children,
  stamp,
  action,
  className,
}: {
  entryNo?: string;
  children: ReactNode;
  stamp?: ReactNode;
  action?: ReactNode;
  className?: ClassValue;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-3 border-b border-line px-4 py-3 last:border-b-0 sm:px-5",
        "sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center",
        className,
      )}
    >
      <span className="type-data pt-0.5 text-ink-muted sm:pt-0">{entryNo}</span>
      <div className="min-w-0">{children}</div>
      {stamp || action ? (
        <div className="col-start-2 mt-2 flex flex-wrap items-center gap-2 sm:col-start-3 sm:mt-0 sm:justify-self-end">
          {stamp}
          {action}
        </div>
      ) : null}
    </div>
  );
}

/** Totals foot — only ever rendered with honestly computed figures. */
export function PanelTotals({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <span className="type-label text-ink-muted">{label}</span>
      <span className="flex flex-wrap items-baseline gap-x-3">
        {note ? <span className="type-meta">{note}</span> : null}
        <span className="type-money text-ink">{value}</span>
      </span>
    </div>
  );
}

/** Compact operational page title (workspace / supplier desk). */
export function DeskPageHeader({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="mb-6 border-b border-line pb-4">
      <h1 className="type-title-md text-ink">{title}</h1>
      {lede ? <p className="mt-1 type-meta text-ink-muted">{lede}</p> : null}
    </header>
  );
}

/** @deprecated Use PanelSheet. */
export const LedgerSheet = PanelSheet;
/** @deprecated Use PanelRow. */
export const LedgerRow = PanelRow;
/** @deprecated Use PanelTotals. */
export const LedgerTotals = PanelTotals;
