/**
 * API host shared by the Next.js rewrite and server-rendered API requests.
 * Local development and production default to the deployed API; API_ORIGIN
 * can still point either environment at a different backend.
 */
export const API_ORIGIN =
  process.env.API_ORIGIN ?? "http://stockpile.runasp.net";
