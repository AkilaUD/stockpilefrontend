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

/** Compact operational page title (workspace / supplier desk). */
export function DeskPageHeader({ title, lede }: { title: string; lede?: string }) {
  return (
    <header className="mb-6 border-b border-line pb-4">
      <h1 className="type-title-md text-ink">{title}</h1>
      {lede ? <p className="mt-1 type-meta text-ink-muted">{lede}</p> : null}
    </header>
  );
}
