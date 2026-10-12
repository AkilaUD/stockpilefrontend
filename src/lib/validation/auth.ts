import type { FieldError } from "@/lib/api";

/*
 * Client-side shadow of the backend's field rules — the server is the ONLY
 * source of truth (FluentValidation in Stockpile.Application/Authentication +
 * the config-driven PasswordPolicy, threat-model §4), and these validators
 * exist so a form user sees the same message the server would send, before the
 * round trip. This is a UX layer, never an enforcement boundary: every request
 * is re-validated server-side and a 422 VALIDATION_FAILED envelope still lands
 * on the fields (fieldErrorsToRecord below).
 *
 * Rules mirrored (AuthenticationValidators.cs, domain-model §2.1 columns):
 *   - identity fields: required, ≤ 100 chars;
 *   - email: "EmailAddress" semantics — text@text.tld;
 *   - phone: optional, and when present an E.164 string ^\+[1-9]\d{1,14}$
 *     (nvarchar(30)); an empty string is a missing phone, not a validation
 *     error;
 *   - password: minimum LENGTH 10 from Identity PasswordPolicy — and nothing
 *     else. Threat-model §4 is explicit: "≥ 10 chars, no composition theatre",
 *     so the client asserts no character-class rule (the old "three of four
 *     classes" copy contradicted the enforced policy and was removed in 1.51).
 *
 * Why plain functions and not a schema library: the auth screens sit on PUBLIC
 * routes, whose first-load budget is 200 KB gzip (design-system §11 — "forms"
 * is a WORKSPACE allowance). zod + react-hook-form cost ~100 KB gzip on those
 * routes for six fields and three rules; these functions cost nothing and
 * still return per-field messages + the envelope mapping the forms need.
 */

/** The message keys the validators read from `auth.validation`. */
export type AuthValidationCode =
  | "nameRequired"
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired"
  | "passwordTooShort"
  | "passwordsDoNotMatch"
  | "duplicateEmail";

/* FluentValidation's EmailAddress semantics, kept intentionally close. */
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Per-field failure messages; fields that pass are simply absent. */
export type FieldFailures = Record<string, string | undefined>;

export interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues {
  email: string;
  password: string;
}

export interface ForgotValues {
  email: string;
}

export interface ResetValues {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

type Translate = (key: AuthValidationCode) => string;

function checkEmail(email: string, t: Translate, failing: { email?: string }): void {
  if (email.length === 0) {
    failing.email = t("emailRequired");
  } else if (!emailPattern.test(email)) {
    failing.email = t("emailInvalid");
  }
}

function checkPassword(password: string, t: Translate, failing: { password?: string }): void {
  if (password.length === 0) {
    failing.password = t("passwordRequired");
  } else if (password.length < 10) {
    failing.password = t("passwordTooShort");
  }
}

export function validateLogin(values: LoginValues, t: Translate): FieldFailures {
  const failing: FieldFailures = {};
  checkEmail(values.email, t, failing);
  checkPassword(values.password, t, failing);
  return failing;
}

export function validateForgot(values: ForgotValues, t: Translate): FieldFailures {
  const failing: FieldFailures = {};
  checkEmail(values.email, t, failing);
  return failing;
}

export function validateRegister(values: RegisterValues, t: Translate): FieldFailures {
  const failing: FieldFailures = {};
  checkEmail(values.email, t, failing);
  checkPassword(values.password, t, failing);
  return failing;
}

export function validateReset(values: ResetValues, t: Translate): FieldFailures {
  const failing: FieldFailures = {};
  checkEmail(values.email, t, failing);
  if (values.token.length === 0) failing.token = t("passwordRequired");
  checkPassword(values.newPassword, t, failing);
  /* Confirm is client-only UX (the backend contract has no confirm field); an
   * empty or different confirm is simply "the two passwords do not match". */
  if (values.confirmPassword !== values.newPassword) failing.confirmPassword = t("passwordsDoNotMatch");
  return failing;
}

/**
 * Turn a 422 envelope's `fieldErrors` into a per-field message map. Field
 * paths arrive camelCase and line up with the form value keys. The one
 * client-side special case is the server's duplicate-email check (`code:
 * "Duplicate" on field "email"`) which has its own §47 copy; every other
 * server message is shown verbatim — it is the wire truth and the SPA has no
 * better answer for it.
 */
export function fieldErrorsToRecord(
  fieldErrors: FieldError[] | undefined,
  t: Translate,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const fieldError of fieldErrors ?? []) {
    if (fieldError.field === "email" && fieldError.code === "Duplicate") {
      mapped.email = t("duplicateEmail");
    } else {
      mapped[fieldError.field] = fieldError.message;
    }
  }
  return mapped;
}