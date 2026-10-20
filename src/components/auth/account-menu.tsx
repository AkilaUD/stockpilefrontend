"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cx } from "@/lib/cx";
import { derivePersonas } from "@/lib/auth/personas";

export function AccountMenu({
  fullName,
  permissions,
  signOutBusy,
  onSignOut,
}: {
  fullName: string;
  /** @deprecated kept for compatibility; navigation is permission-derived. */
  roles?: readonly string[];
  permissions?: readonly string[];
  signOutBusy: boolean;
  onSignOut: () => void;
}) {
  const tActions = useTranslations("common.actions");
  const tNav = useTranslations("nav");
  const personas = derivePersonas(permissions ?? []);
  // Fallback: accounts with no desk permissions still reach their account home.
  const showWorkspace = personas.canAccessBuyerDesk || (!personas.canAccessSupplierDesk && !personas.canAccessAdminShell);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cx("max-w-48 gap-1", signOutBusy && "opacity-60")}>
          <span className="truncate">{fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showWorkspace && (
          <DropdownMenuItem asChild>
            <Link href="/workspace">{tNav("workspace")}</Link>
          </DropdownMenuItem>
        )}
        {personas.canAccessSupplierDesk && (
          <DropdownMenuItem asChild>
            <Link href="/supplier">{tNav("supplierDesk")}</Link>
          </DropdownMenuItem>
        )}
        {personas.canAccessAdminShell && (
          <DropdownMenuItem asChild>
            <Link href="/admin">{tNav("admin")}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={signOutBusy} onSelect={onSignOut}>
          {tActions("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
