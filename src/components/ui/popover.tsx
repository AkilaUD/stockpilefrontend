"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/*
 * Popover — design-system.md §6.9 ("Radix UI: … Popover … restyled to
 * tokens"). Composed here, not imported from Radix at call sites, so the
 * restyle and the §13.10 focus contract live in exactly one place.
 *
 * The DepartmentMenu uses it as a disclosure anchored to the masthead's
 * "Shop By Department" block: the panel is portaled to <body>, which also
 * resolves its semantic tokens against the LIGHT page (not the header's
 * `data-surface="dark"` subtree) — a floating panel over the page reads as
 * a page surface.
 *
 * Radix owns open state, outside-pointer/Escape dismissal, arrow-key
 * interaction and focus return; the classes supply tokens and motion
 * (the `dropdown-content` entrance is menu-shaped: scale+fade, cancelled
 * under prefers-reduced-motion in globals.css §7.2).
 */

export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />;
}

export function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />;
}

export function PopoverContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        className={cx(
          "dropdown-content z-overlay rounded-md border border-line bg-surface-elevated shadow-elev-lg",
          "outline-none", // Radix content is focus-managed; no painted ring on the panel itself
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}