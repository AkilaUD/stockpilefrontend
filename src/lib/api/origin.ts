/**
 * API host shared by the Next.js rewrite and server-rendered API requests.
 *
 * Always set `API_ORIGIN` explicitly (see `.env.example`). Development may fall
 * back to localhost; production builds fail closed so a missing env cannot
 * silently talk to a hard-coded host.
 */
function resolveApiOrigin(): string {
  const configured = process.env.API_ORIGIN?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "API_ORIGIN must be set for production builds and runtime. "
        + "See .env.example and docs/railway-deployment.md.",
    );
  }

  return "http://localhost:5080";
}

export const API_ORIGIN = resolveApiOrigin();
