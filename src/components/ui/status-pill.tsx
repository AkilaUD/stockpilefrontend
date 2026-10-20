import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/*
 * StatusPill — design-system.md §6.8, governed by §15 rule 8 ("every status
 * colour paired with a text label") and §10 ("colour is never the sole
 * signal ... always text + shape").
 *
 * So the shape of the contract is: `children` IS the label and must be text.
 * The tone colours the border, the tint and the leading dot — three redundant
 * carriers behind the words, never instead of them. Text renders in `ink`
 * (11.2:1 on the neutral ground, re-roleing to #d6d6d6 on dark ones) because
 * the tone colours are not AA-safe as small text: `warning` (#ffd100) measures
 * ≈1.0:1 on the neutral field, which §10 would fail at any size. Colour lives
 * in the dot where its job is only to be scannable, not readable.
 *
 * `rounded-full` is the §4.1 exception in person: "999 — ONLY avatars, status
 * dots, text-bearing status pills". This is the text-bearing case.
 *
 * A Server Component: it renders text and spans, nothing interactive.
 */

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

interface StatusPillProps {
  /** The text label. Colour never speaks alone (§15.8). */
  children: ReactNode;
  /** Defaults to `neutral` — the state of "no state to declare". */
  tone?: StatusTone;
  className?: ClassValue;
}

/*
 * Each tone: border + tint + dot. The opacity modifiers compile to
 * `color-mix` against the semantic variable, so a tone re-roles with the
 * surface (inline resolution — §4.3) and never bakes a literal.
 */
const TONES: Record<StatusTone, ClassValue> = {
  neutral: ["border-line-strong bg-surface-recessed", "before:bg-ink-muted"],
  info: ["border-info/40 bg-info/10", "before:bg-info"],
  success: ["border-success/40 bg-success/10", "before:bg-success"],
  warning: ["border-warning/45 bg-warning/10", "before:bg-warning"],
  danger: ["border-danger/40 bg-danger/10", "before:bg-danger"],
};

const STAMP_TONES: Record<StatusTone, string> = {
  neutral: "border-ink/50 text-ink",
  info: "border-ink/60 text-ink",
  success: "border-[#2e6b34]/60 text-[#2e6b34]",
  warning: "border-[#8a6d00]/60 text-[#8a6d00]",
  danger: "border-danger/60 text-danger",
};

/**
 * Ledger stamp — a rotated, bordered state mark ("IN STOCK", "ACCEPTED").
 * Text always carries the state; rotation is slight (-2deg) and removed
 * under prefers-reduced-motion by the global motion reset.
 */
export function Stamp({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: ClassValue;
}) {
  return (
    <span
      className={cx(
        "type-stamp inline-block -rotate-2 rounded-[2px] border-[1.5px] px-1.5 py-0.5 bg-surface-elevated/60",
        STAMP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ children, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "type-meta whitespace-nowrap text-ink",
        /* The dot is a ::before so the label stays the element's only content
         * — screen readers meet the text, the pseudo-element is decoration
         * (`aria-hidden` semantics come free: generated content is not
         * announced by default). */
        "before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
