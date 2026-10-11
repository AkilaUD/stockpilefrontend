/**
 * API host shared by the Next.js rewrite and server-rendered API requests.
 * Local development uses the local API; production defaults to the MonsterASP
 * site so a missing Vercel variable does not make SSR call localhost.
 */
export const API_ORIGIN =
  process.env.API_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? "https://stockpile.runasp.net"
    : "http://localhost:5080");
