import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";
import type { ReactNode } from "react";

/*
 * EditorialSectionHead — the shared head for public editorial sections
 * (design-system.md §6.1; §8.3 composition alternation).
 *
 * One component so the nine home sections cannot drift into nine different
 * head styles. `align` alternates per section — no two consecutive sections
 * share the same left/right balance (§8.3, §66 defence). Eyebrow is mono
 * uppercase; the title carries the section's meaning, never the eyebrow's
 * words repeated (F7-adjacent restraint, §9 voice).
 *
 * Server Component: no interactivity, pure markup.
 */

interface EditorialSectionHeadProps {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  /** Alternate per section — the caller owns the alternation sequence. */
  align?: "left" | "right";
  linkHref?: string;
  linkLabel?: string;
}

export function EditorialSectionHead({
  eyebrow,
  title,
  lede,
  align = "left",
  linkHref,
  linkLabel,
}: EditorialSectionHeadProps) {
  const right = align === "right";
  return (
    <div className={cx("flex flex-col gap-4 md:flex-row md:items-end", right ? "md:flex-row-reverse md:text-right" : "md:justify-between")}>
      <div className={cx("max-w-2xl", right && "md:ml-auto")}>
        <p className="type-label text-primary">{eyebrow}</p>
        <h2 className="type-display-md mt-2 text-ink">{title}</h2>
        {lede && <p className="type-body mt-3 text-ink-muted">{lede}</p>}
      </div>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="type-body shrink-0 text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
