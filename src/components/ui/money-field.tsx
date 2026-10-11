"use client";

import { FormField, fieldControlClassName, type FormFieldControlProps } from "./form-field";
import { currencySymbol } from "@/lib/money";
import { cx, type ClassValue } from "@/lib/cx";

/*
 * MoneyField — design-system.md §6.8.
 *
 * "use client" and why (§15 rule 3): the value is normalised *as it is
 * typed* — grouping separators stripped on paste, everything but digits and
 * one decimal point dropped, fraction clamped to the field's precision. That
 * is interactivity; the value itself stays fully controlled by the caller
 * (no state here), but there is an event handler, which no Server Component
 * can own.
 *
 * The currency symbol is read from `lib/money.ts` config, never written into
 * this file (§15 rule 7), and it appears twice for two different readers:
 *
 *   - visually, as a prefix inside the control box (aria-hidden — the glyph
 *     is not what a screen reader should spell out mid-edit);
 *   - for assistive tech, as sr-only text appended to the field's own label,
 *     so the accessible name reads "Total LKR". That keeps WCAG 2.5.3
 *     satisfied — the visible label is a prefix of the accessible name —
 *     without duplicating a translated string at every call site.
 *
 * The affix shares one border box with the input, so the §10 focus ring is
 * drawn on the box itself via `focus-within`; the input opts out with
 * `outline-none`, which is only legal because that replacement ring is
 * visible on the box the user aimed at.
 */

interface MoneyFieldProps {
  /** Caller-owned id — client forms generate it with `useId()`. */
  id: string;
  /** Visible label text (translated at the call site). */
  label: React.ReactNode;
  /** Controlled value — a string so the caller keeps exactly what was typed. */
  value: string;
  /** Called with the normalised value (digits, at most one dot, precision capped). */
  onValueChange: (value: string) => void;
  /** ISO code, always supplied by the caller from the backend `Money`
   *  contract — a default here would smuggle a hard-coded currency past
   *  §15 rule 7. The display symbol comes from config. */
  currency: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  requiredText?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  /** Fraction digits the input accepts. Mirrors the display default (2). */
  decimalPlaces?: number;
  className?: ClassValue;
}

/**
 * Strip everything but digits and a single decimal point, then clamp the
 * fraction. Separators never survive (`1,204,180` pastes as `1204180`); a
 * trailing dot survives so the next keystroke can complete the value.
 */
function normalizeDecimal(raw: string, decimalPlaces: number): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");

  if (firstDot === -1) {
    return cleaned;
  }

  const whole = cleaned.slice(0, firstDot);
  if (decimalPlaces === 0) {
    return whole;
  }

  const fraction = cleaned.slice(firstDot + 1).replace(/\./g, "");
  return `${whole}.${fraction.slice(0, decimalPlaces)}`;
}

export function MoneyField({
  id,
  label,
  value,
  onValueChange,
  currency,
  hint,
  error,
  required,
  requiredText,
  name,
  placeholder,
  disabled,
  autoComplete,
  decimalPlaces = 2,
  className,
}: MoneyFieldProps) {
  const symbol = currencySymbol(currency);
  const hasError = Boolean(error);

  return (
    <FormField
      id={id}
      label={
        <>
          {label}
          <span className="sr-only"> {symbol}</span>
        </>
      }
      hint={hint}
      error={error}
      required={required}
      requiredText={requiredText}
      className={className}
    >
      {(control: FormFieldControlProps) => (
        <div
          className={cx(
            fieldControlClassName,
            "flex items-center gap-1.5 pr-3 pl-2.5",
            hasError && "border-danger",
            "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
            "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-line has-[:disabled]:bg-surface-recessed",
          )}
        >
          <span aria-hidden="true" className="shrink-0 font-mono text-xs text-ink-muted">
            {symbol}
          </span>
          <input
            {...control}
            type="text"
            inputMode="decimal"
            name={name}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            onChange={(event) => onValueChange(normalizeDecimal(event.target.value, decimalPlaces))}
            className="w-full min-w-0 bg-transparent font-mono text-sm text-ink tabular-nums outline-none placeholder:font-sans placeholder:text-ink-muted disabled:cursor-not-allowed disabled:text-ink-muted"
          />
        </div>
      )}
    </FormField>
  );
}
