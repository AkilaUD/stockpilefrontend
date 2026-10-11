"use client";

/*
 * MegaMenu — the department mega-menu that opens from the masthead's
 * "Categories" trigger (design-system.md §6.1, api.md §2.3 tree source).
 *
 * Interactivity only: open/close state + hover timing + scroll dismissal.
 * The tree itself is fetched server-side by SiteHeader and passed as props —
 * the client bundle never fetches it and never owns the data (§15 rule 3,
 * server/client boundary), which is exactly what keeps this a small island.
 *
 * Panel semantics: a disclosure (aria-expanded button + a region of links),
 * not a menu of commands — natural tab order; Esc/outside-pointer dismissal
 * and focus return come from Radix Popover (the ui/popover wrapper); hover
 * adds a convenience open with a deliberate delay so a mouse travelling from
 * the trigger to the panel does not flap it closed.
 *
 * Geometry: Radix positions its content box around the trigger, but the panel
 * must span the header width (portal → tokens resolve against the LIGHT page,
 * not the dark masthead subtree), so the outer Radix box is collapsed and the
 * visible surface is an inner `fixed inset-x-0` panel. During the open/close
 * animation the outer box's transform scales the whole thing from the top
 * centre (the `dropdown-content` fallback origin — globals.css §6.9).
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MegaMenuProps {
  /** Full category tree (roots with nested children), server-fetched. */
  tree: CategoryNode[];
}

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 180;

export function MegaMenu({ tree }: MegaMenuProps) {
  const t = useTranslations("catalogue.menu");
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    // A scroll under the panel means the visitor is reading the page, not the
    // menu: close rather than float the panel across new content.
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const openSoon = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    if (openTimer.current === null) {
      openTimer.current = window.setTimeout(() => {
        openTimer.current = null;
        setOpen(true);
      }, OPEN_DELAY_MS);
    }
  };

  const closeSoon = () => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    openTimer.current = null;
    if (closeTimer.current === null) {
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        setOpen(false);
      }, CLOSE_DELAY_MS);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={openSoon}
          onMouseLeave={closeSoon}
          className="font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span className="inline-flex items-center gap-1">
            {tNav("categories")}
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3">
              <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={0}
        onMouseEnter={() => {
          if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
          closeTimer.current = null;
          setOpen(true);
        }}
        onMouseLeave={closeSoon}
        className="border-0 bg-transparent p-0 shadow-none"
      >
        <div className="fixed inset-x-0 top-16 z-overlay max-h-[70vh] overflow-y-auto border-b border-line bg-surface-elevated shadow-elev-lg md:top-20">
          <div className="shell-public grid gap-x-8 gap-y-6 py-8 pb-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tree.map((department) => (
              <div key={department.slug}>
                <Link
                  href={`/categories/${department.slug}`}
                  className="type-title-sm text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
                >
                  {department.name}
                </Link>
                {department.children.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {department.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/categories/${child.slug}`}
                          className="type-body-sm text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-surface-panel">
            <div className="shell-public flex items-center justify-between gap-4 py-3">
              <Link
                href="/products"
                className="type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
              >
                {t("allCategories")}
              </Link>
              <span className="type-meta text-ink-muted">{t("browse")}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}