"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/*
 * Tabs — design-system.md §6.9: "Radix UI: … Tabs … All restyled to tokens;
 * Radix defaults are never visible — it provides behaviour and a11y, not
 * appearance."
 *
 * "use client" and why (§15 rule 3): Radix manages tab selection, roving
 * focus and arrow-key navigation (the ARIA tabs pattern) — interactivity.
 *
 * Appearance decisions:
 *
 *   - Trigger labels use `type-label` — uppercase Plex Mono is §3.1's
 *     "column heads" register, and a tab strip is a row of column heads.
 *   - The active indicator is `border-b-2 border-brand-primary` pulled down
 *     `-mb-px` over the list's own hairline, so the signal-yellow rule replaces
 *     the grey one instead of stacking beneath it (2 + 1 = 3px would read as
 *     a printing error). Inactive triggers carry a transparent 2px border of
 *     the same height, so activation shifts nothing.
 *   - No rounding (§4.1: technical sections use hard edges), no shadow
 *     (§4.2: elevation is for transient surfaces, and a tab strip is page
 *     furniture).
 *   - Focus keeps the §10 ring verbatim rather than relying on the active
 *     border: an active tab and a focused tab are different facts.
 *   - No open/close animation: switching a tab is a state change, not a
 *     transition — §7 keeps motion for hierarchy, continuity and feedback,
 *     and none of those is served by sliding panels around (§7.2 makes the
 *     same call for reduced motion by default).
 */

export function Tabs(props: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cx("flex border-b border-line", className)} {...props} />;
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cx(
        "-mb-px border-b-2 border-transparent px-3 py-2.5 type-label text-ink-muted",
        "transition-colors duration-fast ease-standard hover:text-ink",
        "data-[state=active]:border-brand-primary data-[state=active]:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cx(
        "pt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
      {...props}
    />
  );
}
