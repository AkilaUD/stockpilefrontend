"use client";

/*
 * AccountMenu — the signed-in header menu (Radix DropdownMenu, design-system
 * §6.9). It is isolated in its own module so AccountStatus can lazy-load it:
 * only a signed-in visitor ever sees this menu, so shipping Radix's dropdown
 * core (~15 KB gzip) on EVERY public first load for the benefit of none of
 * the signed-out majority would be §11 budget waste. Dynamic import keeps it
 * out of every route's initial payload; it arrives (once, cached) in the
 * brief moment between hydration and this menu's first paint.
 *
 * Interactivity: open state, roving focus, keyboard navigation — Radix's job.
 */

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

export function AccountMenu({
  fullName,
  signOutBusy,
  onSignOut,
}: {
  fullName: string;
  signOutBusy: boolean;
  onSignOut: () => void;
}) {
  const tActions = useTranslations("common.actions");
  const tNav = useTranslations("nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cx("max-w-48 gap-1", signOutBusy && "opacity-60")}>
          <span className="truncate">{fullName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/workspace">{tNav("workspace")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={signOutBusy} onSelect={onSignOut}>
          {tActions("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}