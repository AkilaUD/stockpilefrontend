import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigators. Components must use these instead of `next/link`
 * and `next/navigation` — the plain versions drop the active locale and would
 * silently bounce a Sinhala user back to English on the next click.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
