"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/*
 * DropdownMenu — design-system.md §6.9: "Radix UI: … DropdownMenu … All
 * restyled to tokens; Radix defaults are never visible — it provides
 * behaviour and a11y, not appearance."
 *
 * "use client" and why (§15 rule 3): Radix owns open state, roving focus,
 * typeahead and item selection — interactivity.
 *
 * Two design decisions worth naming:
 *
 * 1. Highlighted item = `bg-brand-primary text-ink-on-signal`. §2 assigns
 *    signal yellow to "selected states", and a keyboard-focused item has to
 *    be *unmistakably* visible (§10) — `surface-recessed` on `surface-elevated`
 *    is a ~1.1:1 shift that would technically exist and practically vanish.
 *    Brand fill makes the focused item the loudest thing in the menu at
 *    13.6:1 text contrast — `ink-on-signal` is mode-invariant, so the pairing
 *    holds whether the menu floats over a light page or the dark masthead.
 *
 * 2. z-index: `z-modal`, not the `z-overlay` tier its name suggests. A menu
 *    opened *inside* a dialog (dialog content sits at `--z-modal`) would be
 *    trapped behind it at `--z-overlay`. Equal z is safe: Radix portals this
 *    content to the body after the dialog's portal, so document order —
 *    which CSS resolves at equal z — puts it on top. No new token (§4.3
 *    scale discipline), no arbitrary value.
 *
 * Elevation: `--elev-md` is the §4.2 slot for dropdowns. Radius `md` (4px)
 * is the panel tier of §4.1. The `transform-origin` comes from Radix's own
 * custom property so the open animation grows from the trigger, and every
 * animation is cancelled under `prefers-reduced-motion` (§7.2, §10).
 */

export function DropdownMenu(props: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />;
}

export function DropdownMenuTrigger(props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cx("type-label px-2.5 pt-2 pb-1.5 text-ink-muted", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cx("my-1 bg-line", className)} {...props} />;
}

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cx(
          "dropdown-content z-modal min-w-48 rounded-md border border-line bg-surface-elevated p-1 shadow-elev-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cx(
        "relative flex cursor-default select-none items-center rounded-sm px-2.5 py-1.5 font-body text-sm text-ink outline-none",
        "data-[highlighted]:bg-brand-primary data-[highlighted]:text-ink-on-signal",
        "data-[disabled]:pointer-events-none data-[disabled]:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}
