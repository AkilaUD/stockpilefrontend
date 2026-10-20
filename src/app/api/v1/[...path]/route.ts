import { API_ORIGIN } from "@/lib/api/origin";

/**
 * Same-origin API proxy — the browser never talks to the API origin directly.
 *
 * Why a route handler instead of a `next.config` rewrite: Vercel's external
 * rewrite refuses the plain-HTTP API origin (ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR),
 * while a server-side `fetch` from this function to the same origin works —
 * the SSR catalogue reads prove that daily. The handler also presents the
 * public surface honestly to the backend: the visitor's scheme and host are
 * forwarded explicitly (`X-Forwarded-Proto`/`X-Forwarded-Host`), so the API's
 * forwarded-headers middleware reconstructs the public HTTPS request and its
 * Secure antiforgery/session cookies mint and validate exactly as they would
 * behind a TLS-terminating proxy (the deployed topology in
 * docs/monsterasp-deployment.md). Cookies stay first-party and production
 * keeps zero CORS.
 *
 * API_ORIGIN stays server-only configuration; nothing here hard-codes a host.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* Hop-by-hop headers describe one connection, never the next one. */
const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function forwardRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const [name, value] of request.headers.entries()) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers.set(name, value);
  }

  const incoming = new URL(request.url);
  /* The first entry is the visitor's scheme; later entries are proxy hops. */
  const publicProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    incoming.protocol.replace(":", "");
  headers.set("x-forwarded-proto", publicProto);
  headers.set("x-forwarded-host", incoming.host);
  return headers;
}

function forwardResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const [name, value] of upstream.headers.entries()) {
    const lower = name.toLowerCase();
    /* fetch has already decoded the body, so length/encoding no longer describe it. */
    if (HOP_BY_HOP.has(lower) || lower === "content-encoding" || lower === "set-cookie") continue;
    headers.set(name, value);
  }
  /* Set-Cookie must survive as separate headers — joining them corrupts expiry dates. */
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }
  return headers;
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = new URL(`/api/v1/${path.map((segment) => encodeURIComponent(segment)).join("/")}`, API_ORIGIN);
  target.search = incoming.search;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(target, {
    method: request.method,
    headers: forwardRequestHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
