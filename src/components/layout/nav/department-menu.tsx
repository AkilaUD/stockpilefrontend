"use client";

/*
 * DepartmentMenu — the "Shop By Department" vertical menu.
 *
 * DESIGN.md homepage is full-bleed photographic; the Magento layout05
 * permanently-open home column (and its 300px hero gutter) is intentionally
 * not reproduced. Disclosure is always a hover/click popover under the block.
 * Radix Popover supplies Esc, outside-pointer dismissal, and focus return, and
 * portals the panel so semantic tokens resolve against the light page, not the
 * dark masthead subtree (§6.9).
 *
 * Interactivity only: open/close state + hover timing + active flyout. The
 * tree is fetched server-side by SiteHeader and passed as props — the client
 * bundle never fetches it (§15 rule 3). The flyout is an inline sibling inside
 * the panel (flex), not a portal of its own: the list column is the element
 * that scrolls, so the flyout cannot be nested inside it the way the
 * reference's `.submenu` sits inside its `.level0` `li`. The panel row is wide
 * enough to hold both columns. The flyout is deliberately not clipped to the
 * department column.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronRight } from "lucide-react";
import { DEPARTMENT_ICONS, categoryHref, sortDepartments } from "@/lib/navigation/navigation";

interface DepartmentMenuProps {
  /** Full category tree (roots with nested children), server-fetched. */
  tree: CategoryNode[];
}

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 180;

/**
 * Shared trigger/block skin. The column width is the `department-block`
 * utility (globals.css): it carries the reference's own ladder — full row
 * below 768, `col-md-3`'s 270px, then the measured 300px `col-lg-3` column
 * from the reference's 1200px flip point.
 *
 * Reference `.vertical-menu .title` (measured 2026-10-14): 300×50,
 * `padding:10px 0`, transparent (the signal-yellow menu row shows through),
 * 16px/500 black, no glyph — the block is its own label.
 *
 * `lazy-nav.tsx`'s DepartmentMenuFallback repeats this string — keep in sync.
 */
const BLOCK_CLASS =
  "inline-flex h-[50px] w-full items-center justify-center bg-brand-primary px-4 font-body text-base font-semibold text-ink-on-signal transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus md:justify-start";

const BLOCK_WIDTH_CLASS = "department-block";

/** The disclosure panel body. Below md: single column with inline children.
 *  md+: side flyout (~540px dual column). */
function DepartmentPanel({
  departments,
  active,
  activeSlug,
  onActivate,
  onPointerEnter,
  onPointerLeave,
}: {
  departments: CategoryNode[];
  active: CategoryNode | null;
  activeSlug: string | null;
  onActivate: (slug: string | null) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const tNav = useTranslations("nav");

  return (
    <div
      className="flex max-h-[min(44rem,80vh)] w-[min(100vw-2rem,20rem)] md:w-auto"
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      {/* Vertical department column. Full width of the constrained panel below
          md; 270→300px from md / 1200px. */}
      <ul
        role="list"
        className="w-full shrink-0 self-start max-h-[min(44rem,80vh)] overflow-y-auto border-b border-[#d3d3d3] bg-surface-panel pt-[15px] pb-[14px] text-ink md:w-[270px] min-[1200px]:w-[300px]"
        onMouseLeave={(event) => {
          // The flyout is a sibling column of this list, not a descendant of
          // it, so crossing from a row into the flyout fires this handler. A
          // move towards the flyout must keep the department active. Only a
          // move out of the whole panel clears it.
          const next = event.relatedTarget;
          if (next instanceof Node && event.currentTarget.parentElement?.contains(next)) return;
          onActivate(null);
        }}
      >
        {departments.map((department) => {
          const icon = DEPARTMENT_ICONS[department.slug];
          const hasChildren = department.children.length > 0;
          const isActive = activeSlug === department.slug;
          return (
            <li key={department.slug}>
              <Link
                href={categoryHref(department.slug)}
                onMouseEnter={() => onActivate(department.slug)}
                onFocus={() => onActivate(department.slug)}
                className={`flex w-full items-center gap-2 py-[9px] pr-[15px] pl-[15px] text-base leading-5 font-normal transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-focus ${
                  isActive ? "bg-brand-primary text-ink" : "text-ink hover:bg-brand-primary"
                }`}
              >
                {icon ? (
                  <Image
                    src={icon}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="size-5 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate">{department.name}</span>
                {hasChildren && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />}
              </Link>
              {/* Mobile: inline children under the active row (no side flyout). */}
              {isActive && hasChildren ? (
                <ul className="border-b border-line bg-surface-recessed pb-1 md:hidden">
                  {department.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={categoryHref(child.slug)}
                        className="block py-2 pr-[15px] pl-10 text-sm leading-5 font-normal text-ink capitalize transition-colors duration-instant ease-standard hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop flyout. Reference `.level1` rows (measured 2026-10-14). */}
      {active && active.children.length > 0 && (
        <div className="hidden w-[16.875rem] shrink-0 overflow-y-auto border-l border-[#d3d3d3] bg-surface-panel py-[15px] md:block">
          <div className="border-b border-line px-[15px] pb-[10px]">
            <h2 className="text-base leading-5 font-medium text-ink">{active.name}</h2>
            <Link
              href={categoryHref(active.slug)}
              className="mt-1 block text-sm font-normal text-ink-accent capitalize transition-colors duration-instant ease-standard hover:text-ink"
            >
              {tNav("viewAllDepartments")} →
            </Link>
          </div>
          <ul>
            {active.children.map((child) => (
              <li key={child.slug} className="pl-[15px]">
                <Link
                  href={categoryHref(child.slug)}
                  className="block border-b border-line py-[10px] pr-[15px] text-base leading-5 font-normal text-ink capitalize transition-colors duration-instant ease-standard hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DepartmentMenu({ tree }: DepartmentMenuProps) {
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

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
        setActiveSlug(null);
      }, CLOSE_DELAY_MS);
    }
  };

  const departments = sortDepartments(tree);
  const active = departments.find((department) => department.slug === activeSlug) ?? null;

  const panel = (
    <DepartmentPanel
      departments={departments}
      active={active}
      activeSlug={activeSlug}
      onActivate={setActiveSlug}
      onPointerEnter={() => {
        if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
        setOpen(true);
      }}
      onPointerLeave={closeSoon}
    />
  );

  // One wrapper so the menu row's flex child keeps a single width
  // (`w-full` under 768, the reference's column above it).
  return (
    <div className={`relative shrink-0 ${BLOCK_WIDTH_CLASS}`}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Dismissing the panel (Esc, an outside click, a link taken) must
          // drop the flyout too, or it is still open the next time the panel
          // appears.
          if (!next) setActiveSlug(null);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-haspopup="dialog"
            onMouseEnter={openSoon}
            onMouseLeave={closeSoon}
            className={BLOCK_CLASS}
          >
            <span>{tNav("shopByDepartment")}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={2}
          className="flex w-auto bg-transparent p-0 shadow-none"
        >
          {panel}
        </PopoverContent>
      </Popover>
    </div>
  );
}
