import { ApiClientError, ApiTimeoutError, isErrorEnvelope, type ErrorEnvelope } from "./envelope";

/**
 * The typed transport every API call goes through (1.49 boundary, api.md
 * §1.4/§1.10).
 *
 * Browser-facing only: the calls are same-origin `/api/v1/*` (the next.config
 * rewrite forwards them to the .NET origin, docs/architecture.md §4), so
 * cookies are first-party and `credentials: "same-origin"` is enough. Cache is
 * deliberately `no-store`: every answer here is either fresh state or credential
 * material (antiforgery tokens, §1.10).
 */

export const DEFAULT_TIMEOUT_MS = 15_000;

/** Header that must carry the double-submit token (api.md §1.1/§1.10). */
const CSRF_HEADER = "X-CSRF-TOKEN";
/** Verbs the antiforgery filter never validates (backend safe-verb rule, C1). */
const SAFE_VERBS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export interface ApiRequestOptions {
  /** Total budget for the request; the caller may override the default. */
  timeoutMs?: number;
  /** Caller-owned cancellation; aborting it rejects with an AbortError. */
  signal?: AbortSignal;
  /**
   * The latest antiforgery token the SPA has received — the `requestToken`
   * MINTED in a response body, never the cookie's own value.
   *
   * Verified against the live backend (1.49): echoing the `.Stockpile.Antiforgery`
   * cookie answers 400 ANTIFORGERY_FAILED, whereas the body token from
   * `GET /auth/antiforgery` (and later mints — login/register/refresh responses
   * carry a fresh `requestToken`) passes the filter. The cookie is only the
   * session anchor; ASP.NET's DefaultAntiforgery validates the header against
   * the server-side request token it paired with it.
   */
  csrfToken?: string | null;
}

/**
 * Normalise a `Retry-After` header (delta-seconds or HTTP-date, §1.5/§1.8) to
 * seconds. Unparseable values return null so callers can degrade to their own
 * default rather than crash on a middlebox's junk.
 */
export function parseRetryAfter(header: string | null, now: number = Date.now()): number | null {
  if (header === null) return null;
  const trimmed = header.trim();
  const delta = Number(trimmed);
  if (Number.isFinite(delta) && delta >= 0) return Math.ceil(delta);
  const asDate = Date.parse(trimmed);
  if (Number.isFinite(asDate)) return Math.max(0, Math.ceil((asDate - now) / 1000));
  return null;
}

async function parseErrorBody(response: Response): Promise<ErrorEnvelope | null> {
  const text = await response.text();
  if (text === "") return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isErrorEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Typed fetch against the API origin.
 *
 * `T` is the success body type (or `void` for 204 answers — deliberately, the
 * caller must name what it expects). Error paths never resolve: a readable
 * §1.4 envelope becomes `ApiClientError`, anything else on the failure path
 * throws per its own kind (TimeoutError vs network TypeError vs caller abort).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();

  const headers = new Headers(init.headers);
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (!SAFE_VERBS.has(method) && options.csrfToken) {
    headers.set(CSRF_HEADER, options.csrfToken);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const onTimeout = () => {
    timedOut = true;
    controller.abort();
  };
  const timer = setTimeout(onTimeout, timeoutMs);
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onCallerAbort, { once: true });

  try {
    const response = await fetch(path, {
      ...init,
      headers,
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const envelope = await parseErrorBody(response);
      const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
      throw new ApiClientError(response.status, envelope, retryAfter);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (timedOut) throw new ApiTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }
}