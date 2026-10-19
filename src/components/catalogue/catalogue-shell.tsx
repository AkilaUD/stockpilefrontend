import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/**
 * CatalogueShell — editorial header rhythm for catalogue surfaces (Material Atlas).
 * Matches InfoPage / NewsShell spacing; breadcrumbs optional for listing roots.
 */
interface CatalogueShellProps {
  crumbs?: { label: string; href?: string }[];
  overline?: string;
  title: string;
  lede?: ReactNode;
  /** Count lines, search forms, etc. sit under the lede. */
  aside?: ReactNode;
  /** Sort row, filter chips — full width below the header block. */
  toolbar?: ReactNode;
  children: ReactNode;
}

export function CatalogueShell({ crumbs, overline, title, lede, aside, toolbar, children }: CatalogueShellProps) {
  return (
    <section className="shell-public py-10 md:py-14">
      {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}

      <header className={crumbs && crumbs.length > 0 ? "mt-6 max-w-3xl" : "max-w-3xl"}>
        {overline && <p className="type-label font-semibold tracking-[0.12em] text-ink-accent">{overline}</p>}
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
        {lede && <div className="mt-4 font-body text-lg leading-relaxed text-ink-muted">{lede}</div>}
        {aside && <div className="mt-6">{aside}</div>}
      </header>

      {toolbar && <div className="mt-8 border-y border-line py-4 md:mt-10">{toolbar}</div>}

      <div className={toolbar ? "mt-8 md:mt-10" : "mt-8 md:mt-10"}>{children}</div>
    </section>
  );
}
