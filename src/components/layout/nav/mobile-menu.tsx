"use client";

/*
 * MobileMenu — the masthead drawer for small viewports (design-system.md
 * §6.1): primary navigation + the department list, so the category hierarchy
 * is reachable without a desktop hover mega-menu. Rendered below `lg` (the
 * site-header decides), so the drawer and the mega-menu never coexist.
 *
 * "use client" is the open/close state; Radix Dialog supplies the modal
 * contract (focus trap, Escape, aria-modal, scroll lock, focus restore).
 * The tree is server-fetched by SiteHeader and passed — the drawer owns no
 * data and the client bundle never fetches the catalogue.
 *
 * The same dark-masthead token problem the mega-menu solves by portaling is
 * solved here by Dialog's Portal: the sheet resolves its semantic tokens
 * against the light page (bg-surface-page, ink text).
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/api/catalogue";

interface MobileMenuProps {
  /** Full category tree (roots only are shown), server-fetched. */
  tree: CategoryNode[];
}

export function MobileMenu({ tree }: MobileMenuProps) {
  const t = useTranslations("catalogue.menu");
  const tCommand = useTranslations("catalogue.command");
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t("open")}
          className="inline-flex size-11 items-center justify-center rounded-sm text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
            <path d="M2 4.5h12M2 8h12M2 11.5h12" strokeLinecap="round" />
          </svg>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="drawer-overlay" />
        <DialogPrimitive.Content className="drawer-content bg-surface-elevated outline-none">
          <div className="flex h-16 items-center justify-between border-b border-line px-6">
            <span className="type-label text-ink-accent">{t("browse")}</span>
            <DialogPrimitive.Close
              aria-label={tA11y("closeDialog")}
              className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
                <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </DialogPrimitive.Close>
          </div>

          <nav aria-label={tA11y("mainNavigation")} className="px-6 py-6">
            <ul className="space-y-1">
              <li>
                <Link href="/" className="block rounded-sm px-3 py-2.5 type-body font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="block rounded-sm px-3 py-2.5 type-body font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {tNav("products")}
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="block rounded-sm px-3 py-2.5 type-body font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {tNav("suppliers")}
                </Link>
              </li>
              <li>
                <Link href="/search" className="block rounded-sm px-3 py-2.5 type-body font-medium text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {tCommand("trigger")}
                </Link>
              </li>
            </ul>
          </nav>

          <section className="border-t border-line px-6 py-6">
            <h2 className="type-label text-ink-accent">{t("browse")}</h2>
            <ul className="mt-4 space-y-3">
              {tree.map((department) => (
                <li key={department.slug}>
                  <Link
                    href={`/categories/${department.slug}`}
                    className="type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {department.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}