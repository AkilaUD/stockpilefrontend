/**
 * Wire shapes for API errors — docs/api.md §1.4, mirrored from
 * `Stockpile.Contracts.Errors.ErrorEnvelope` exactly.
 *
 * `fieldErrors` is the ONLY optional member: the backend serializes with nulls
 * suppressed, so absent members are omitted, never null (1.20). `supportReference`
 * and `retryable` are non-optional on the wire (non-nullable record fields), so
 * the §47 mapping and the TanStack retry policy can rely on them.
 */
export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  fieldErrors?: FieldError[];
  correlationId: string;
  supportReference: string;
  retryable: boolean;
  timestamp: string;
}

/**
 * Type guard over a parsed error body.
 *
 * Checks only the members the mapper touches; a proxy-level HTML 5xx or a
 * random 404 body fails the guard and the error is treated as envelope-less
 * (the mapper falls back to generic §47 copy instead of reading garbage).
 */
export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.correlationId === "string" &&
    typeof candidate.supportReference === "string" &&
    typeof candidate.retryable === "boolean"
  );
}

/**
 * An HTTP error carrying the backend's §1.4 envelope when one was readable.
 *
 * `envelope` stays `null` for non-envelope bodies (and `retryable` then reads
 * false) so the retry policy can never interpret an unclassifiable response as
 * "definitely retry".
 */
export class ApiClientError extends Error {
  readonly status: number;
  readonly envelope: ErrorEnvelope | null;
  /** Seconds until the caller may retry (from `Retry-After`), when given. */
  readonly retryAfterSeconds: number | null;

  constructor(status: number, envelope: ErrorEnvelope | null, retryAfterSeconds: number | null = null) {
    super(envelope?.message ?? `HTTP ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.envelope = envelope;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * The transport gave up on its own deadline — distinct from an AbortError the
 * CALLER raised (that one propagates untouched so callers can cancel).
 *
 * Distinctness matters twice: the §47 mapping answers errors.timeout copy, and
 * the retry policy deliberately does NOT auto-retry a timed-out request — the
 * backend may still be running the action server-side (errors.timeout says so:
 * "the action may still be running").
 */
export class ApiTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request exceeded the ${timeoutMs} ms timeout`);
    this.name = "ApiTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Should the caller automatically retry this failure?
 *
 * Backend-authoritative: the envelope's own `retryable` flag is the decision
 * (the backend marks only INTERNAL_ERROR/RATE_LIMITED retryable, §1.20's
 * registry), never a client guess about status codes. Envelope-less HTTP
 * errors and timeouts are not auto-retried; anything that never produced an
 * HTTP response (network-level failure) is treated as transient.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ApiClientError) return error.envelope?.retryable ?? false;
  if (error instanceof ApiTimeoutError) return false;
  return true;
}