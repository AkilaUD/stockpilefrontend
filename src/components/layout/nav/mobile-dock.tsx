"use client";

/*
 * MobileDock — the fixed bottom tab bar (reference reconstruction Phase 2
 * §4.4). The reference mobile theme keeps five entries under the thumb:
 * Menu · Search · Home · My Order · Me.
 *
 *   Menu    → the drawer (MobileMenuDialog, dock-styled trigger)
 *   Search  → /search (the SSR catalogue search page)
 *   Home    → /
 *   My Order → /workspace (the buyer's order & RFQ desk)
 *   Me      → /workspace when signed in, else /login
 *
 * "Me" answers "am I signed in?" from the session cookie on THIS browser, so
 * the dock is a client island (like AccountStatus). "My Order" always points
 * at /workspace — a signed-out visitor is redirected by that route's own
 * guard, whatever it is, so the tab needs no session to render.
 *
 * The bar is `md:hidden`: at 768px+ the masthead has room for the full
 * chrome and the drawer hamburger, and the reference site drops the
 * bottom bar there too. It rides at `z-sticky` so page content scrolls
 * beneath it; the mounted `main` gets bottom padding from the parent layout
 * (pb-14 lg:pb-0) so the last section is never hidden behind the bar.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { ReferenceIcon } from "@/components/ui/reference-icon";
import type { CategoryNode } from "@/lib/api/catalogue";
import { derivePersonas } from "@/lib/auth/personas";
import { MobileMenuDialog } from "./mobile-menu";

interface MobileDockProps {
  /** Full category tree (roots only), server-fetched — feeds the Menu drawer. */
  tree: CategoryNode[];
}

/**
 * The five dock tabs' glyphs are the reference's own `mbi-*` icons (mobile
 * theme: Menu · Search · Home · My Order · Me). This map must stay in step
 * with `lazy-nav.tsx`'s `MobileDockFallback` — a mismatch is a visible flash
 * when the island swaps in.
 */
const DOCK_ICON = {
  menu: "mbi-menu",
  search: "mbi-magnifier",
  home: "mbi-home3",
  order: "mbi-bag2",
  user: "mbi-user",
} as const;

type DockIconName = keyof typeof DOCK_ICON;

function DockIcon({ name }: { name: DockIconName }) {
  return <ReferenceIcon name={DOCK_ICON[name]} className="size-5" />;
}

const ITEM_CLASS =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 font-body text-[11px] font-medium text-ink-muted transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function MobileDock({ tree }: MobileDockProps) {
  const tNav = useTranslations("nav");
  const tA11y = useTranslations("a11y");
  const { status, user } = useSession();

  const personas = derivePersonas(user?.permissions ?? []);
  const deskHref = personas.canAccessBuyerDesk
    ? "/workspace"
    : personas.canAccessSupplierDesk
      ? "/supplier"
      : personas.canAccessAdminShell
        ? "/admin"
        : "/workspace";
  const meHref = status === "signedIn" && user ? deskHref : "/login";

  return (
    <nav
      aria-label={tA11y("mobileDockNavigation")}
      className="fixed inset-x-0 bottom-0 z-sticky flex border-t border-line bg-surface-panel pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <MobileMenuDialog
        tree={tree}
        trigger={
          <button
            type="button"
            aria-label={tA11y("openMenu")}
            className={ITEM_CLASS}
          >
            <DockIcon name="menu" />
            <span>{tNav("menu")}</span>
          </button>
        }
      />
      <Link href="/search" className={ITEM_CLASS}>
        <DockIcon name="search" />
        <span>{tNav("searchSubmit")}</span>
      </Link>
      <Link href="/" className={ITEM_CLASS}>
        <DockIcon name="home" />
        <span>{tNav("home")}</span>
      </Link>
      <Link href={status === "signedIn" && user ? deskHref : "/workspace"} className={ITEM_CLASS}>
        <DockIcon name="order" />
        <span>{tNav("myOrder")}</span>
      </Link>
      <Link href={meHref} className={ITEM_CLASS}>
        <DockIcon name="user" />
        <span>{tNav("me")}</span>
      </Link>
    </nav>
  );
}
