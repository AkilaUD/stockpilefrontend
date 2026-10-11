"use client";

import { FormField, fieldControlClassName } from "./form-field";
import { cx, type ClassValue } from "@/lib/cx";

/*
 * QuantityField — design-system.md §6.8's "QuantityField (value + UOM)".
 *
 * "use client" and why (§15 rule 3): two controls in one labelled group, both
 * fully controlled, with change handlers — interactivity, so this is where
 * the client boundary sits. Everything above it (the FormField, the label,
 * the error text) stays server-renderable.
 *
 * The unit OPTIONS are a required prop, never a default list inside this
 * file. The catalogue's units of measure are domain data the API owns; a
 * hard-coded array here would be exactly the fake functionality §0.6 forbids
 * — a picker that offers units the backend may reject. The caller passes
 * what `/catalog` (task 2.x) eventually serves, translated.
 *
 * Two controls means two ids: the visible label points at the value input
 * (`htmlFor`), the unit select carries its own sr-only label — required by
 * §10 ("every input has a `<label>`") even when the select's own value makes
 * the purpose obvious visually. `label-in-name` (WCAG 2.5.3) is satisfied
 * because the sr-only label is exactly the visible unit text's role.
 *
 * Each control keeps its own focus ring rather than sharing one on a wrapper:
 * with two tab stops side by side, a shared ring would never say which one
 * has focus, and §10 wants the focused element itself visible.
 */

export interface QuantityUnitOption {
  /** Machine value sent to the API. */
  value: string;
  /** Display label — translated at the call site. */
  label: React.ReactNode;
}

interface QuantityFieldProps {
  /** Caller-owned id for the value input — client forms use `useId()`. */
  id: string;
  /** Visible label for the number ("Quantity", translated). */
  label: React.ReactNode;
  /** sr-only label for the unit select ("Unit", translated). */
  unitLabel: React.ReactNode;
  /** Controlled numeric text. */
  value: string;
  onValueChange: (value: string) => void;
  /** Controlled unit code. */
  unit: string;
  onUnitChange: (unit: string) => void;
  /** Unit options from the API's domain data — no defaults (§0.6). */
  units: QuantityUnitOption[];
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  requiredText?: string;
  name?: string;
  unitName?: string;
  disabled?: boolean;
  /** `<input type="number">` step — "any" for continuous measures (kg), "1" for counts. */
  step?: string;
  min?: string;
  className?: ClassValue;
}

export function QuantityField({
  id,
  label,
  unitLabel,
  value,
  onValueChange,
  unit,
  onUnitChange,
  units,
  hint,
  error,
  required,
  requiredText,
  name,
  unitName,
  disabled,
  step = "any",
  min,
  className,
}: QuantityFieldProps) {
  const unitId = `${id}-unit`;

  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      requiredText={requiredText}
      className={className}
    >
      {(control) => (
        <div className="flex items-stretch gap-2">
          <input
            {...control}
            type="number"
            inputMode="decimal"
            name={name}
            value={value}
            step={step}
            min={min}
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            className={cx(fieldControlClassName, "min-w-0 flex-1 font-mono tabular-nums")}
          />

          <div className="relative shrink-0">
            <label htmlFor={unitId} className="sr-only">
              {unitLabel}
            </label>
            <select
              id={unitId}
              name={unitName}
              value={unit}
              disabled={disabled}
              aria-describedby={control["aria-describedby"]}
              onChange={(event) => onUnitChange(event.target.value)}
              className={cx(
                fieldControlClassName,
                /* Native select chrome would be the one un-tokened surface on
                 * the page; the chevron below restores the affordance the
                 * removed arrow carried. */
                "cursor-pointer appearance-none pr-9 pl-3",
                "disabled:cursor-not-allowed",
              )}
            >
              {units.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
            >
              <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </FormField>
  );
}
