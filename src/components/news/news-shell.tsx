import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/*
 * NewsShell — the news surface's page shell: breadcrumb trail plus the page
 * header, on the same public spacing as InfoPage (the news tree sits on the
 * same editorial surface and should not drift from it).
 *
 * Separate from InfoPage because the news tree navigates by bucket: an article
 * carries Home / News / <bucket> / <title>, and InfoPage takes one crumb.
 */
interface NewsShellProps {
  /** Trail after the Home crumb, outermost first. */
  crumbs: { label: string; href?: string }[];
  title: string;
  children: ReactNode;
}

export function NewsShell({ crumbs, title, children }: NewsShellProps) {
  return (
    <section className="shell-public py-10 md:py-14">
      <Breadcrumbs items={crumbs} />

      <header className="measure-editorial mt-6">
        <h1 className="type-display-md mt-1 font-extrabold text-ink">{title}</h1>
      </header>

      <div className="mt-8 md:mt-10">{children}</div>
    </section>
  );
}
