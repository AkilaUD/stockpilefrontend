import { ApiClientError, ApiTimeoutError } from "./envelope";

/**
 * The single place error responses become user copy (1.49, docs/design-system
 * §9 "Error copy (§47) is always context-aware with a next action").
 *
 * Resolution order:
 *   1. timeout / network / unknown kinds → their dedicated keys
 *   2. a KEYED envelope code → the message file's own §47 copy (frontend
 *      voice, includes the next action)
 *   3. RATE_LIMITED → keyed copy with the real `Retry-After` seconds
 *   4. INTERNAL_ERROR → the `unexpected` key with the backend's support
 *      reference (the one case that copy exists for)
 *   5. any other envelope code → the backend's own localized message (wire
 *      truth for codes we have not keyed; api.md §1.4 messages are already
 *      §47-shaped)
 *   6. no readable envelope (proxy-level HTML 5xx, non-envelope 404) → the
 *      reference-less fallback — still context-aware, still an action
 *
 * The message file is the only source of English/Sinhala strings (§15 rule 6).
 */

export interface ErrorCopyFunction {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
}

/** Fallback when a 429 carries no parseable Retry-After (it always should). */
const RATE_LIMITED_FALLBACK_SECONDS = 60;

export function resolveErrorCopy(t: ErrorCopyFunction, error: unknown): string {
  if (error instanceof ApiTimeoutError) return t("timeout");

  if (error instanceof ApiClientError) {
    const { envelope } = error;
    if (envelope === null) return t("unexpectedNoReference");

    if (envelope.code === "RATE_LIMITED") {
      return t(envelope.code, { seconds: error.retryAfterSeconds ?? RATE_LIMITED_FALLBACK_SECONDS });
    }
    if (t.has(envelope.code)) return t(envelope.code);
    if (envelope.code === "INTERNAL_ERROR") {
      return t("unexpected", { reference: envelope.supportReference });
    }
    return envelope.message;
  }

  // fetch() rejects with a TypeError on network failure. Timeouts are their own
  // class (ApiTimeoutError, handled above). Anything else — an abort the caller
  // started, a thrown bug — is none of the classifiable cases.
  if (error instanceof TypeError) return t("network");
  return t("unexpectedNoReference");
}