import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/*
 * InfoPage — the editorial content-page shell (reference reconstruction
 * Phase 2 §4.4: the reference content pages share this pattern — breadcrumb
 * trail, page header, prose body). Server Component; copy arrives as props /
 * children so the shell owns no English.
 *
 * Renders inside the `(public)` layout's <main>, so no <main> here —
 * semantic sections only.
 */
interface InfoPageProps {
  /** Current-page label for the breadcrumb trail. */
  breadcrumb: string;
  title: string;
  /** Optional small uppercase eyebrow above the title. */
  overline?: string;
  /** Optional paragraph under the title. */
  lede?: string;
  children: ReactNode;
}

export function InfoPage({ breadcrumb, title, overline, lede, children }: InfoPageProps) {
  return (
    <section className="shell-public py-10 md:py-14">
      <Breadcrumbs items={[{ label: breadcrumb }]} />

      <header className="measure-editorial mt-6">
        {overline && <p className="type-label font-semibold text-ink-accent">{overline}</p>}
        <h1 className="type-display-md mt-1 font-extrabold text-ink">{title}</h1>
        {lede && <p className="type-body mt-4 text-ink-muted md:text-lg">{lede}</p>}
      </header>

      <div className="mt-8 md:mt-10">{children}</div>
    </section>
  );
}