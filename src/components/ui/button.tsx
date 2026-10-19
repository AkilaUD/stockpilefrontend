import { Link } from "@/i18n/navigation";
import { cx, type ClassValue } from "@/lib/cx";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/*
 * Split into `Button` (an action) and `ButtonLink` (a navigation target) rather
 * than one component with an optional `href`.
 *
 * The obvious alternative — a discriminated union that renders `<Link>` when a
 * href is present — drags a client component into every call site and makes the
 * props of an otherwise inert element conditional. Two small components with one
 * shared class builder keep both renderable as Server Components
 * (design-system.md §15 rule 3: `"use client"` only for interactivity), which
 * matters because most uses sit above the fold on editorial pages.
 *
 * Semantics still decide: a thing that navigates is an `<a>` (and gets an href
 * before focus), a thing that acts is a `<button type>`. The visual sameness is
 * the point of the class builder, not a reason to blur the two.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleProps {
  /** Defaults to `primary` — the single most likely intent at a call site. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE: ClassValue = [
  "relative inline-flex items-center justify-center gap-2",
  "font-body font-medium whitespace-nowrap",
  "rounded-sm select-none",
  "transition-colors duration-instant ease-standard",
  /* §10's ring, verbatim: 2px `--color-focus` at 2px offset. The explicit
   * `outline-focus` is load-bearing — an unset outline colour inherits
   * `currentColor`, which on a primary button is the dark on-signal text, and
   * dark text drawn in the page gutter outside the signal fill would be
   * invisible. */
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "disabled:pointer-events-none disabled:opacity-50",
  "active:translate-y-px",
];

const VARIANTS: Record<ButtonVariant, ClassValue> = {
  /*
   * Signal fill (§2: signal yellow is THE action colour). Text is
   * `ink-on-signal`, not `ink-inverse`: a #ffee32 fill takes #202020 text on
   * every ground — `text-ink-inverse` would re-role to light text under
   * `data-surface="dark"` and produce light-on-yellow. Hover steps to the
   * secondary signal #ffd100 (brief §2.1: hover/active variations).
   *
   * The 1px ink rules top and bottom are the reference's own
   * (`a.action.primary`: borderBlock 1px #020202) — they are what makes the
   * signal block read as a printed button rather than a highlight.
   */
  primary: [
    "border border-ink bg-brand-primary text-ink-on-signal",
    "hover:bg-brand-primary-hover",
  ],

  /* Outline that fills on hover — reads as deliberate rather than as a
   * disabled primary. Border uses `ink-strong`, not `line`, so it is a
   * structural statement at every size. */
  secondary: [
    "border border-ink-strong text-ink bg-surface-panel",
    "hover:bg-surface-recessed",
  ],

  ghost: ["text-ink bg-transparent hover:bg-surface-recessed"],
};

const SIZES: Record<ButtonSize, ClassValue> = {
  // 36px — dense rows and dialog footers.
  sm: "h-9 px-[15px] text-sm",
  // 44px — default; comfortably clears WCAG 2.2 §2.5.8 target size.
  md: "h-11 px-[15px] text-base",
  // 48px — editorial calls to action only.
  lg: "h-12 px-[15px] text-base",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: ButtonStyleProps = {}): string {
  return cx(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full");
}

/*
 * Native button props are forwarded wholesale rather than re-declared one
 * by one. The original closed list (`ariaLabel`, `name`, `value`, …) made
 * `asChild` composition impossible: Radix slots trigger behaviour INTO this
 * component (`onClick`, `aria-haspopup`, `aria-expanded`, `data-state`), a
 * closed list silently dropped all of it, and the result was a dialog or
 * menu trigger that did nothing — invisible to `tsc`, to eslint and to the
 * build, obvious only in a browser. The bespoke `aria*` aliases are gone
 * with it: the native attributes were always the real API.
 */
type NativeButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

export interface ButtonProps extends ButtonStyleProps, NativeButtonProps {
  children: ReactNode;
  className?: ClassValue;
}

/**
 * An action. Never renders an `href`, so it can never be the wrong element for
 * a navigation — and `type` defaults to `"button"` so it cannot accidentally
 * submit a form it happens to sit inside.
 */
export function Button({
  children,
  className,
  variant,
  size,
  fullWidth,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    /* `...rest` first, explicit props after: the caller (or a Radix slot)
     * owns everything else, but `type`, `disabled` and the composed class
     * chain stay ours. */
    <button
      {...rest}
      type={type}
      className={cx(buttonClassName({ variant, size, fullWidth }), className)}
    >
      {children}
    </button>
  );
}

/*
 * Same forwarding contract as `Button`: native anchor props in, dropped
 * nowhere. `href` stays a plain string (the locale prefixing is next-intl's
 * job, not the caller's).
 */
type NativeLinkProps = Omit<ComponentPropsWithoutRef<"a">, "children" | "className" | "href">;

export interface ButtonLinkProps extends ButtonStyleProps, NativeLinkProps {
  href: string;
  children: ReactNode;
  className?: ClassValue;
}

/** Navigation styled as a button. Locale prefixing is handled by next-intl. */
export function ButtonLink({
  href,
  children,
  className,
  variant,
  size,
  fullWidth,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      className={cx(buttonClassName({ variant, size, fullWidth }), className)}
    >
      {children}
    </Link>
  );
}
