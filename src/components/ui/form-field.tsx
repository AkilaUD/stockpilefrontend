import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/*
 * FormField — design-system.md §6.8, wiring §10's form requirements:
 *
 *   "every input has a `<label>`, errors linked via `aria-describedby` +
 *    `aria-invalid`"
 *
 * The pairing problem (label ↔ control ↔ hint ↔ error) is solved with a
 * render-prop child rather than `cloneElement` or context: the FIELD owns the
 * ids and hands them out as ready-made aria attributes, so the caller's
 * control attaches them with a spread and no call site can forget the
 * wiring — which is exactly the class of bug the §10 checklist exists to
 * catch. That also keeps this component a Server Component (§15 rule 3 — no
 * state, no hooks; `useId` is a hook and would force the whole form subtree
 * to the client), while a client form (react-hook-form, tasks 1.49/1.51)
 * still drives it with the id it generated in `useId()`:
 *
 *   <FormField id={id} label={t("common.labels.email")} error={errors.email?.message}>
 *     {(control) => <input {...control} type="email" className={fieldControlClassName} />}
 *   </FormField>
 *
 * The keys are the literal DOM attribute names so a bare `{...control}` is
 * always correct — there is no intermediate vocabulary to mistranslate.
 */

export interface FormFieldControlProps {
  /** Id for the control. Caller-owned so client forms can `useId()` it. */
  id: string;
  /** Hint and/or error ids — omitted entirely when neither exists. */
  "aria-describedby"?: string;
  /** Present exactly when an error is rendered. */
  "aria-invalid"?: true;
}

interface FormFieldProps {
  id: string;
  label: ReactNode;
  children: (control: FormFieldControlProps) => ReactNode;
  /** Guidance shown under the control. Stays visible while an error is shown —
   *  a format hint and a validation failure are different facts. */
  hint?: ReactNode;
  /** The failure message. Its presence is what marks the control invalid. */
  error?: ReactNode;
  /** Marks the control `aria-required` via a `*` (decorative, `aria-hidden`)
   *  plus the caller's translated `a11y.requiredField` for screen readers —
   *  colour or a bare asterisk is never the only signal (§10). */
  required?: boolean;
  requiredText?: string;
  className?: ClassValue;
}

export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required,
  requiredText,
  className,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter((value): value is string => value !== undefined).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {/*
       * `type-label` (§3.1) — uppercase Plex Mono is the field-label register.
       * `ink-muted` rather than `ink-faint`: labels are readable content and
       * `ink-faint` measures ≈2.1:1 (§4.3 forbids it for copy).
       */}
      <label htmlFor={id} className="type-label flex items-baseline gap-1 text-ink-muted">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-danger">
              *
            </span>
            {requiredText && <span className="sr-only"> {requiredText}</span>}
          </>
        )}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": hasError || undefined,
      })}

      {hint && (
        <p id={hintId} className="type-meta text-ink-muted">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="type-meta text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The shared control box — text inputs, money and quantity fields, and any
 * raw `<input>`/`<textarea>` a call site composes into a `FormField`.
 *
 * Exported as a class builder (the `buttonClassName` pattern) rather than a
 * wrapper component, because the control's *identity* stays at the call site:
 * a form that needs `autoComplete`, `inputMode` or a react-hook-form `ref`
 * should not have to thread them through a prop list that mirrors the DOM.
 *
 * It is resolved to a `string` at module load, deliberately: a raw
 * `ClassValue` array handed to `className` would be coerced by React as
 * `Array.prototype.toString` — comma-joined tokens that silently match
 * nothing. `cx()` here makes that failure mode unrepresentable.
 *
 * Decisions worth naming:
 *   - `h-11` — 44px, the same height as `Button` size `md`, so a field beside
 *     a button shares its line and both clear WCAG 2.2 §2.5.8 target size.
 *   - `rounded-sm` — §4.1 assigns 2px to inputs specifically.
 *   - `border-line-strong` — an input is a structural edge, not a hairline
 *     divider (§2.1 keeps `line` for rules, `line-strong` for structure).
 *   - focus: the §10 ring, verbatim — 2px `--color-focus` at 2px offset. The
 *     explicit `outline-focus` matters: an unset outline colour inherits
 *     `currentColor`, which for a light-on-dark button would put the ring in
 *     the page gutter where it cannot be seen.
 *   - `aria-[invalid=true]:border-danger` — the border re-states what
 *     `aria-invalid` says programmatically; colour is never the only signal
 *     because `FormField` also renders the message text (§10).
 */
export const fieldControlClassName: string = cx([
  "block h-11 w-full rounded-sm border border-line-strong bg-surface-elevated px-3",
  "font-body text-sm text-ink placeholder:text-ink-muted",
  "transition-colors duration-fast ease-standard",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "aria-[invalid=true]:border-danger",
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-recessed disabled:text-ink-muted",
]);
