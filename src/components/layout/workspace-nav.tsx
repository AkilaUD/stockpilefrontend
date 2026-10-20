"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSessionPermissions } from "@/lib/auth/use-session-permissions";
import { cx } from "@/lib/cx";

/** Persona-driven private nav — only desks the session permissions admit. */
export function WorkspaceNav() {
  const t = useTranslations("nav");
  const { status, canAccessBuyerDesk, canAccessSupplierDesk, canAccessAdminShell } = useSessionPermissions();
  const pathname = usePathname();
  if (status !== "signedIn") return null;

  const links = [
    ...(canAccessBuyerDesk ? [{ href: "/workspace", label: t("workspace") }] : []),
    ...(canAccessSupplierDesk ? [{ href: "/supplier", label: t("supplierDesk") }] : []),
    ...(canAccessAdminShell ? [{ href: "/admin", label: t("admin") }] : []),
  ];
  if (links.length === 0) return null;

  return (
    <nav aria-label={t("workspace")} className="flex items-center gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "type-meta whitespace-nowrap rounded-sm px-2 py-1",
              active ? "bg-surface-recessed font-medium text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
