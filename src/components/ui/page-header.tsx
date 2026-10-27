import type { ReactNode } from "react";
import { cx, type ClassValue } from "@/lib/cx";

/** Standard page heading block — eyebrow, title, lede, optional actions. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: ClassValue;
}) {
  return (
    <header className={cx("flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="type-label text-ink-muted">{eyebrow}</p> : null}
        <h1 className="type-display-md mt-1 text-ink">{title}</h1>
        {lede ? <p className="type-body mt-2 text-ink-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** Section heading used across public pages. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  className?: ClassValue;
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="type-label flex items-center gap-2 text-ink-muted"><span aria-hidden className="inline-block h-2 w-2 bg-brand-primary" />{eyebrow}</p> : null}
        <h2 className="type-title-lg mt-1 text-ink">{title}</h2>
        {lede ? <p className="type-body-sm mt-1 text-ink-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
