"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

/*
 * Dialog — design-system.md §6.9: "Radix UI: Dialog … All restyled to tokens;
 * Radix defaults are never visible — it provides behaviour and a11y, not
 * appearance."
 *
 * "use client" and why (§15 rule 3): Radix manages open state, the focus
 * trap, Escape, focus restoration and scroll locking — all interactivity.
 * The a11y contract §10 sets for dialogs (focus trap, `Escape`, focus
 * restore, `aria-modal`) is precisely what Radix implements; our job is the
 * appearance and the strings.
 *
 * The close button's aria-label comes from `a11y.closeDialog` via next-intl —
 * §15 rule 6 ("all strings through next-intl formatters") applies to
 * component-internal chrome too, so there is no English literal in this file.
 *
 * Layout/animation live in `.dialog-overlay` / `.dialog-content`
 * (globals.css, `@layer components` so utilities can still win — §4.3):
 * radius 6px is the §4.1 slot reserved for dialogs, `--elev-overlay` is the
 * §4.2 elevation dialogs exist for, and both animations collapse under
 * `prefers-reduced-motion` (§7.2). No backdrop blur — F2 forbids
 * `backdrop-filter` outside its allowlist.
 *
 * `DialogTitle` is required by Radix (an untitled dialog is announced as
 * unnamed); render it even when the design wants it small — the §13.10
 * "sr-only titles" pattern is available via className, not by omission.
 */

export function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

export function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

export function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />;
}

export function DialogContent({ children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  const t = useTranslations("a11y");

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        /* §10 requires `aria-modal` on dialogs; Radix 1.2.0 sets role,
         * aria-labelledby and aria-describedby but not this attribute
         * (verified in node_modules/@radix-ui/react-dialog/dist/index.mjs —
         * DialogContentImpl emits no aria-modal), so the wrapper supplies
         * the pin the spec asks for. This component is the modal dialog;
         * Radix's non-modal variant is deliberately not exposed. */
        aria-modal="true"
        className="dialog-content rounded-lg border border-line bg-surface-elevated p-6 shadow-elev-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={t("closeDialog")}
          className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-sm text-ink-muted transition-colors duration-fast ease-standard hover:bg-surface-recessed hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
            <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  /* `pr-10` clears the close button on the first line; callers overriding the
   * class do so knowing the button sits top-right. */
  return <DialogPrimitive.Title className={cx("pr-10", className)} {...props} />;
}

export function DialogDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description {...props} />;
}
