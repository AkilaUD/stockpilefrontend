"use client";

/*
 * MobileMenu — the masthead drawer for small viewports (design-system.md
 * §6.1, reference reconstruction Phase 2 §4.4). Rendered below `lg` by the
 * site-header; it owns the 768–1023 band where the full masthead row cannot
 * fit. The same drawer is re-used by the mobile dock's "Menu" tab through the
 * exported MobileMenuDialog with a dock-styled trigger.
 *
 * Cabinet sections, matching the reference mobile menu:
 *   1. primary nav (Home / Products / Search);
 *   2. "Shop By Department" — the tree as an accordion (native
 *      <details>/<summary>: no state, full keyboard support);
 *   3. quick links (Get Quotes / How It Works / Our Suppliers / About /
 *      Contact / Help);
 *   4. account (Sign in / Create account).
 *
 * "use client" is the open/close state; Radix Dialog supplies the modal
 * contract (focus trap, Escape, aria-modal, scroll lock, focus restore).
 * The tree is server-fetched and passed — the drawer owns no data and the
 * client bundle never fetches the catalogue.
 *
 * The same dark-masthead token problem the department menu solves by
 * portaling is solved here by Dialog's Portal: the sheet resolves its
 * semantic tokens against the light page (bg-surface-page, ink text).
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";
import { MOBILE_QUICK_LINKS, SUPPLIER_LINKS, categoryHref, sortDepartments } from "@/lib/navigation/navigation";

interface MobileMenuProps {
  /** Full category tree (roots only are shown), server-fetched. */
  tree: CategoryNode[];
}

const ROW_LINK =
  "block rounded-sm px-3 py-2.5 font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * The drawer's body. `onNavigate` lets the owner close the dialog after a
 * link is chosen (Radix does not auto-close on inner navigation).
 */
function MobileMenuPanel({ tree, onNavigate }: MobileMenuProps & { onNavigate?: () => void }) {
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const tCommand = useTranslations("catalogue.command");
  const tActions = useTranslations("common.actions");

  const departments = sortDepartments(tree);

  return (
    <DialogPrimitive.Content className="drawer-content bg-surface-elevated outline-none">
      <div className="flex h-16 items-center justify-between border-b border-line px-6">
        <span className="type-label text-ink-accent">{tNav("menu")}</span>
        <DialogPrimitive.Close
          aria-label={tA11y("closeDialog")}
          className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
            <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </DialogPrimitive.Close>
      </div>

      <div className="px-6 py-5">
        <nav aria-label={tA11y("mainNavigation")}>
          <ul className="space-y-1">
            <li>
              <Link href="/" onClick={onNavigate} className={ROW_LINK}>
                {tNav("home")}
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={onNavigate} className={ROW_LINK}>
                {tNav("products")}
              </Link>
            </li>
            <li>
              <Link href="/search" onClick={onNavigate} className={ROW_LINK}>
                {tCommand("trigger")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <section className="border-t border-line px-6 py-5">
        <h2 className="type-label text-ink-accent">{tNav("shopByDepartment")}</h2>
        <ul className="mt-3 space-y-2">
          {departments.map((department) => (
            <li key={department.slug}>
              {department.children.length > 0 ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-sm px-2 py-2 font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{department.name}</span>
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="size-3 shrink-0 text-ink-muted transition-transform duration-instant ease-standard group-open:rotate-180"
                    >
                      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <ul className="mt-1 space-y-0.5 border-l border-line pl-3">
                    <li>
                      <Link
                        href={categoryHref(department.slug)}
                        onClick={onNavigate}
                        className="block rounded-sm px-2 py-1.5 font-body text-sm font-semibold text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {tNav("allDepartments")} — {department.name}
                      </Link>
                    </li>
                    {department.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={categoryHref(child.slug)}
                          onClick={onNavigate}
                          className="block rounded-sm px-2 py-1.5 font-body text-sm text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <Link
                  href={categoryHref(department.slug)}
                  onClick={onNavigate}
                  className="block rounded-sm px-2 py-2 font-body text-sm font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {department.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line px-6 py-5">
        <ul className="space-y-1">
          {MOBILE_QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={onNavigate} className={ROW_LINK}>
                {tNav(link.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Reference `ul.header.links` on small viewports: the masthead row only
          shows these from `xl`, so the drawer is where they live below it. */}
      <section className="border-t border-line px-6 py-5">
        <ul className="space-y-1">
          {SUPPLIER_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={onNavigate} className={ROW_LINK}>
                {tNav(link.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex gap-3 border-t border-line px-6 py-5">
        <Link
          href="/login"
          onClick={onNavigate}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-ink-strong bg-surface-panel font-body text-sm font-semibold text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {tActions("signIn")}
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-ink font-body text-sm font-semibold text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {tActions("register")}
        </Link>
      </section>
    </DialogPrimitive.Content>
  );
}

/**
 * The dialog shell. `trigger` is rendered as the Radix trigger — the masthead
 * hamburger here, the dock's "Menu" tab in mobile-dock.tsx. Owns open state
 * so choosing a link inside the panel closes the drawer.
 */
export function MobileMenuDialog({
  tree,
  trigger,
}: MobileMenuProps & { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="drawer-overlay" />
        <MobileMenuPanel tree={tree} onNavigate={() => setOpen(false)} />
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Masthead hamburger — the small-screen entry point (rendered by SiteHeader). */
export function MobileMenu({ tree }: MobileMenuProps) {
  const tA11y = useTranslations("a11y");
  return (
    <MobileMenuDialog
      tree={tree}
      trigger={
        <button
          type="button"
          aria-label={tA11y("openMenu")}
          className="inline-flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
            <path d="M2 4.5h12M2 8h12M2 11.5h12" strokeLinecap="round" />
          </svg>
        </button>
      }
    />
  );
}