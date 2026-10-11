import { NextResponse } from "next/server";

export const runtime = "nodejs";

/*
 * CSP violation sink — threat-model §13.15 ("Report-Only mode is used for a
 * CSP rollout before enforcement") and implementation-plan 1.22.
 *
 * It is a *real* endpoint, not a stub: browsers post to it, it validates,
 * de-duplicates and logs. Three things it deliberately does not do:
 *
 *   - It never fails a report. A malformed or hostile body is dropped with a
 *     204; the reporter must never see an error it can act on.
 *   - It never trusts the body. Everything is clipped before it reaches the
 *     log, so a caller cannot inflate log volume through cardinality.
 *   - It is not rate-limited. The bounds below do that job instead: a size
 *     cap on the body and a cap on *distinct* keys, after which further new
 *     violations are suppressed. When the API-side rate limiting and log
 *     pipeline land (§1C/§1D), this is where a violation event should be
 *     emitted instead of `console.warn`.
 */

/** Bigger CSP reports are junk; a real one is well under 2 KB. */
const MAX_BODY_BYTES = 16 * 1024;

/** Distinct violations kept per process. Bounds memory *and* log volume. */
const MAX_DISTINCT = 256;

/** Per-field clip, so one key cannot be made arbitrarily long. */
const MAX_FIELD = 200;

type Violation = {
  directive: string;
  blocked: string;
  document: string;
  sample: string;
};

const seen = new Set<string>();
let saturated = false;

/** Read a field that arrives kebab-cased (`report-uri`) or camel-cased (`report-to`). */
function pick(source: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    const value = source[name];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

/**
 * Clip and, where it is a URL, strip the query string. Query strings are the
 * unbounded part: an attacker-controlled parameter would otherwise mint a new
 * distinct key per request and exhaust `seen` in seconds.
 */
function clip(value: unknown, keepQuery = false): string {
  if (typeof value !== "string") return "";
  const trimmed = keepQuery ? value : value.split("?")[0];
  return trimmed.slice(0, MAX_FIELD);
}

function toViolation(raw: unknown): Violation | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const report = raw as Record<string, unknown>;

  const directive = clip(
    pick(report, "effective-directive", "effectiveDirective", "violated-directive") ?? "",
  );
  if (!directive) return null;

  return {
    directive,
    blocked: clip(pick(report, "blocked-uri", "blockedURL") ?? "inline"),
    document: clip(pick(report, "document-uri", "documentURL") ?? ""),
    // `sample` is source text — keep punctuation (it is the useful part) but
    // not length.
    sample: clip(pick(report, "sample") ?? "", true),
  };
}

/**
 * Both shapes the policy asks for:
 *   `report-uri`  → `{ "csp-report": { … } }`
 *   `report-to`   → an array of Reporting API `Report` objects, CSP ones
 *                   carrying the same fields under `body`
 */
function extract(payload: unknown): Violation[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const report = entry as Record<string, unknown>;
      const violation = report.body ? toViolation(report.body) : toViolation(report);
      return violation ? [violation] : [];
    });
  }
  if (payload && typeof payload === "object") {
    const violation = toViolation((payload as Record<string, unknown>)["csp-report"]);
    return violation ? [violation] : [];
  }
  return [];
}

function logOnce(violation: Violation): void {
  const key = `${violation.directive}|${violation.blocked}|${violation.document}`;
  if (seen.has(key)) return;

  if (seen.size >= MAX_DISTINCT) {
    if (!saturated) {
      saturated = true;
      console.warn(
        "[csp] distinct-violation cap reached; further NEW violations are suppressed until restart",
      );
    }
    return;
  }

  seen.add(key);
  console.warn(
    `[csp] ${violation.directive} blocked=${violation.blocked || "(empty)"} on=${violation.document || "(unknown)"}` +
      (violation.sample ? ` sample=${JSON.stringify(violation.sample)}` : ""),
  );
}

function acknowledge(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    for (const violation of extract(JSON.parse(text) as unknown)) {
      logOnce(violation);
    }
  } catch {
    // Not JSON: nothing to learn from it, and nothing to tell the sender.
  }

  return acknowledge();
}

export function GET(): NextResponse {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
