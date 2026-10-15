import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cx } from "@/lib/cx";

/*
 * UserGuideShell — the reference's user-guide layout (reference reconstruction
 * §4.4 / PARITY.md gap C).
 *
 * Every page the reference publishes under its user guide shares one chrome: a
 * breadcrumb, a left "contents" column, the topic body, and a Prev/Next topic
 * pair at the foot. The contents column comes from `pages.userGuide.nav`, so
 * the shared chrome lives in the message file with the rest of the copy.
 *
 * Two entries the reference lists but never linked ("Buyer Registration",
 * "Updating Buyer Profile") stay in the list as plain text: the reference has
 * no destination for them either, and inventing one would be a fake link.
 *
 * The body column carries `min-w-0`: it is a grid item, so its automatic
 * minimum size would otherwise be its content's min-content width — and the
 * specification page's 28 tables (min-width 36rem) would then stretch the
 * whole grid to 576px and scroll the document sideways at phone widths.
 * With `min-w-0` the column takes the track width and the tables scroll
 * inside their own `overflow-x-auto` wrapper.
 *
 * Server Component — no state, no effects.
 */
export interface GuideNavItem {
  label?: string;
  href?: string;
}

export interface GuideNavEntry extends GuideNavItem {
  /** Group heading; its `items` render nested. */
  title?: string;
  items?: GuideNavItem[];
}

/** Depth-first list of the entries that have a real destination. */
function linkedTopics(nav: GuideNavEntry[]): Array<{ label: string; href: string }> {
  const out: Array<{ label: string; href: string }> = [];
  for (const entry of nav) {
    if (entry.href && entry.label) out.push({ label: entry.label, href: entry.href });
    for (const item of entry.items ?? []) {
      if (item.href && item.label) out.push({ label: item.label, href: item.href });
    }
  }
  return out;
}

const linkClass =
  "block rounded-sm px-3 py-2 type-body-sm transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function UserGuideShell({
  title,
  lede,
  nav,
  navLabel,
  current,
  prevLabel,
  nextLabel,
  topicNavLabel,
  children,
}: {
  title: string;
  lede?: string;
  nav: GuideNavEntry[];
  navLabel: string;
  /** The current route, used to mark the active topic and pick Prev/Next. */
  current: string;
  prevLabel: string;
  nextLabel: string;
  /**
   * Accessible name for the Prev/Next pager. It must differ from `navLabel`:
   * both are `<nav>` landmarks inside the same `<main>`, and two landmarks
   * sharing one name are indistinguishable to a screen reader.
   */
  topicNavLabel: string;
  children?: ReactNode;
}) {
  const topics = linkedTopics(nav);
  const index = topics.findIndex((topic) => topic.href === current);
  const previous = index > 0 ? topics[index - 1] : undefined;
  const next = index >= 0 && index < topics.length - 1 ? topics[index + 1] : undefined;

  return (
    <section className="shell-public py-10 md:py-14">
      <Breadcrumbs items={[{ label: title }]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <nav aria-label={navLabel} className="lg:sticky lg:top-6 lg:self-start">
          <ul className="space-y-1 border-l border-line pl-1">
            {nav.map((entry) =>
              entry.items && entry.items.length > 0 ? (
                <li key={entry.title}>
                  {/* A group heading with an `href` is a link in the reference
                      too: "Stockpile for Suppliers" points at the supplier
                      registration page (captured: ref-content/en-user-guide.json
                      → links). It carries `title` rather than `label`, so the
                      link text falls back to the heading. `linkedTopics` keeps
                      group headings out of the Prev/Next pager, so this shared
                      destination does not appear twice there. */}
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      aria-current={current === entry.href ? "page" : undefined}
                      className={cx(
                        linkClass,
                        "font-semibold",
                        current === entry.href
                          ? "bg-surface-recessed text-ink"
                          : "text-ink hover:bg-surface-recessed",
                      )}
                    >
                      {entry.label ?? entry.title}
                    </Link>
                  ) : (
                    <p className="px-3 py-2 type-label text-ink">{entry.title}</p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {entry.items.map((item) =>
                      item.href ? (
                        <Link
                          key={item.label}
                          href={item.href}
                          aria-current={current === item.href ? "page" : undefined}
                          className={cx(
                            linkClass,
                            "pl-6",
                            current === item.href
                              ? "bg-surface-recessed font-semibold text-ink"
                              : "text-ink-muted hover:bg-surface-recessed hover:text-ink",
                          )}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        /* No destination in the reference either — text, not a link. */
                        <p key={item.label} className="pl-6 pr-3 py-2 type-body-sm text-ink-faint">
                          {item.label}
                        </p>
                      ),
                    )}
                  </ul>
                </li>
              ) : (
                <li key={entry.label}>
                  <Link
                    href={entry.href ?? "/user-guide"}
                    aria-current={current === entry.href ? "page" : undefined}
                    className={cx(
                      linkClass,
                      current === entry.href
                        ? "bg-surface-recessed font-semibold text-ink"
                        : "text-ink-muted hover:bg-surface-recessed hover:text-ink",
                    )}
                  >
                    {entry.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="min-w-0">
          <header className="measure-editorial">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
              {title}
            </h1>
            {lede && <p className="mt-4 type-body leading-relaxed text-ink-muted">{lede}</p>}
          </header>

          <div className="mt-8">{children}</div>

          {(previous || next) && (
            <nav
              aria-label={topicNavLabel}
              className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-5"
            >
              {previous ? (
                <Link
                  href={previous.href}
                  className="type-body-sm font-medium text-ink-muted transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {prevLabel}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={next.href}
                  className="type-body-sm font-medium text-ink-muted transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {nextLabel}
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
