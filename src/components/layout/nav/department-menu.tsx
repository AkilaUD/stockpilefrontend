"use client";

/*
 * DepartmentMenu — the "Shop By Department" vertical menu (reference
 * reconstruction, Phase 2 §4.4): the dark department block at the left end of
 * the menu row, with a flyout of subcategories to the right.
 *
 * Reference: https://stockpile.lk/ (Magento/MageBig "Martfury layout05").
 * Two behaviours, measured off the live site on 2026-10-14:
 *
 *   ≥ 1200px, home page (`.layout05.cms-index-index`)
 *     the list is PERMANENTLY OPEN. `.vertical-menu .navigation` is
 *     `display:block; margin-top:30px` — a ~300px column of the ten
 *     departments (rows 41px, `level0` hover `#f6e71d`) that the home banner
 *     row reserves: `.bn-inner`'s row holds an EMPTY 300px `col-md-3` beside a
 *     75%-wide hero (`col-xl-9`), so the list fills that gutter rather than
 *     covering the hero. The page content is offset by the same column (see
 *     HomeHero's `min-[1200px]:pl-[300px]`).
 *     It only applies while the header sits at the top of the page: the theme
 *     hides it the moment the header goes sticky
 *     (`.sticky-menu.active .vertical-menu .navigation { display:none }`).
 *
 *   everything else
 *     the reference's `.vertical-menu:hover .navigation` disclosure — a
 *     hover/click panel under the block. Radix Popover supplies that contract
 *     (Esc, outside-pointer dismissal, focus return) and portals the panel, so
 *     its semantic tokens resolve against the light page, not the dark
 *     masthead subtree (§6.9).
 *
 * The threshold is 1200px — the theme's own breakpoint, not Tailwind's `xl`
 * (1280) — so it is written as an arbitrary variant (`min-[1200px]`).
 *
 * Interactivity only: open/close state + hover timing + active flyout. The
 * tree is fetched server-side by SiteHeader and passed as props — the client
 * bundle never fetches it (§15 rule 3). The flyout is an inline sibling inside
 * the panel (flex), not a portal of its own: the list column is the element
 * that scrolls, so the flyout cannot be nested inside it the way the
 * reference's `.submenu` sits inside its `.level0` `li`. The panel row is wide
 * enough to hold both columns, which keeps the 1s scroll-pause behaviour of the
 * reference menu without fighting Radix positioning twice. The flyout is
 * deliberately not clipped to the department column: the reference's
 * `.vertical-menu` computes `overflow: visible` and its `.submenu` is
 * `left:100%; z-index:999` (measured 2026-10-15), so it floats out over the
 * banner — clipping it makes every submenu link unreachable.
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReferenceIcon } from "@/components/ui/reference-icon";
import { DEPARTMENT_ICONS, categoryHref, sortDepartments } from "@/lib/navigation/navigation";

interface DepartmentMenuProps {
  /** Full category tree (roots with nested children), server-fetched. */
  tree: CategoryNode[];
}

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 180;

/**
 * The theme's own breakpoint for the permanently-open list (1200px), and the
 * scroll distance past which the header counts as sticky — both read from
 * layout05's stylesheet, not chosen.
 */
const PERSISTENT_MEDIA = "(min-width: 1200px)";
const STICKY_AT_PX = 8;

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
  "inline-flex h-[50px] w-full items-center justify-center bg-transparent px-0 font-body text-base font-medium text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus md:justify-start";

const BLOCK_WIDTH_CLASS = "department-block";

/** The disclosure panel body — identical in both behaviours. */
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
      className="flex max-h-[min(44rem,80vh)]"
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      {/* Vertical department column. 270px is the reference's own `max-width`;
          from 1200px the panel is the reference's measured 300px column, so it
          fills the home page's reserved gutter exactly.

          `self-start` + its own `max-h` keep this column at ITS OWN height
          (reference: `.vertical-menu .navigation`, 414px of rows) instead of
          stretching to the flyout beside it — the reference's `.submenu` is
          absolutely positioned and so cannot resize the column it hangs off.
          The panel's `max-h` still clamps the pair, and the column still
          scrolls when its own list is longer than the viewport allows.

          Skin — reference `.vertical-menu .navigation` (measured 2026-10-14):
          white, `padding:15px 0 14px`, `border-bottom:1px #d3d3d3`, and rows of
          16px/400 black text, `padding:9px 15px` (38px row), hover
          `#f6e71d`. The reference's rows ARE links to the department, and each
          carries a 13px down glyph; the reference has no "All Departments"
          row — its list is the departments themselves. */}
      <ul
        role="list"
        className="w-[270px] min-[1200px]:w-[300px] shrink-0 self-start max-h-[min(44rem,80vh)] overflow-y-auto border-b border-[#d3d3d3] bg-surface-panel pt-[15px] pb-[14px] text-ink"
        onMouseLeave={(event) => {
          // The flyout is a sibling column of this list, not a descendant of
          // it, so crossing from a row into the flyout fires this handler. The
          // reference's disclosure is `.level0:hover > .show-sub` — the row and
          // its flyout are ONE hover region — so a move towards the flyout must
          // keep the department active. Only a move out of the whole panel
          // clears it, and the panel's own onMouseLeave already does that.
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
                {hasChildren && <ReferenceIcon name="mbi-ios-arrow-down" className="size-[13px]" />}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Flyout. Reference `.level1` rows (measured 2026-10-14): a 270px column
          of 16px/400 `capitalize` links, `padding:10px 15px`, one hairline
          between rows. */}
      {active && active.children.length > 0 && (
        <div className="w-[16.875rem] shrink-0 overflow-y-auto border-l border-[#d3d3d3] bg-surface-panel py-[15px]">
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [wide, setWide] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  // The list is permanently open on the home page from 1200px up. `matchMedia`
  // is read after mount (the island mounts client-side only — `ssr: false` in
  // lazy-nav — so neither value can cause a hydration mismatch).
  useEffect(() => {
    const query = window.matchMedia(PERSISTENT_MEDIA);
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // …and only while the header is at the top of the page: the reference
  // collapses the list the moment the header goes sticky, so the panel never
  // follows the sticky masthead down the page.
  useEffect(() => {
    const sync = () => setAtTop(window.scrollY <= STICKY_AT_PX);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

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
  const persistent = pathname === "/" && wide && atTop;

  const blockBody = <span>{tNav("shopByDepartment")}</span>;

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

  // One wrapper in both behaviours so the menu row's flex child keeps a single
  // width (`w-full` under 768, the reference's column above it).
  return (
    <div className={`relative shrink-0 ${BLOCK_WIDTH_CLASS}`}>
      {persistent ? (
        <>
          {/* Open by default: the block is the column's heading, not a
              control, so it is a plain label rather than a dead button. The
              list that follows is the disclosure surface. */}
          <p className={BLOCK_CLASS}>{blockBody}</p>
          {/* `w-full` matters: it keeps the panel's border box exactly the
              reserved gutter (the reference's measured column). The reference
              drops the tip 30px below the row (`.navigation { margin-top:30px }`),
              so the panel is offset rather than flush.

              No `overflow-hidden` here: the reference's `.vertical-menu`
              computes `overflow: visible` and its `.submenu` is
              `position:absolute; left:100%; top:0; z-index:999`, so the flyout
              is meant to float out over the banner (measured on the live site
              2026-10-15). Clipping it to this box makes every submenu link
              unreachable. */}
          <div className="absolute left-0 top-[calc(100%+1.875rem)] z-raised w-full">
            {panel}
          </div>
        </>
      ) : (
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
              {blockBody}
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
      )}
    </div>
  );
}
