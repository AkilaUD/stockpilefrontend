import Image from "next/image";
import { Link } from "@/i18n/navigation";

/*
 * HeroBanner — the home hero (reference reconstruction Phase 2 §4.4).
 *
 * The original hero is a single editorial graphic ("How it works" flyer)
 * linking to the how-it-works page. We reuse the original asset
 * (public/original/hero-how-it-works.jpg, 871×366 ≈ 2.4:1) and keep that
 * whole-banner link: the full-width graphic plus a small dark CTA chip in the
 * bottom corner, so the affordance does not rely on the image alone (§10).
 *
 * Server Component; copy arrives as props so this file owns no English.
 */
interface HeroBannerProps {
  /** Page-level heading (the reference home headline) — one h1 per page. */
  headline: string;
  /** Screen-reader description of the banner image. */
  alt: string;
  /** Visible CTA label (e.g. "Learn How Stockpile Works"). */
  cta: string;
}

export function HeroBanner({ headline, alt, cta }: HeroBannerProps) {
  return (
    /*
     * The banner lives inside the public container (the reference's
     * `.banner-slider-top` measures the full container width, 1170px at a
     * 1440px viewport), and from 1200px its left 300px is the reserved column
     * for the permanently-open "Shop By Department" list — the reference's
     * `.bn-inner` row pairs an empty `col-md-3` with a 75%-wide `col-xl-9`
     * hero. The list (in the header's menu row, aligned to the same container
     * edge) fills that gutter instead of covering the banner.
     */
    <section className="bg-surface-recessed">
      <div className="shell-public">
        {/*
          The 300px reservation is a *second* offset inside the container, not a
          replacement for the container's own gutter: at 1280px the container
          content starts at (1280-1200)/2 + 15 = 55px, the reserved column is
          55→355, and the hero must start at 355. A single `shell-public
          min-[1200px]:pl-[300px]` element would put the hero at 40 + 300 = 340
          and overlap the department list by the 15px gutter.
        */}
        <div className="min-[1200px]:pl-[300px]">
          {/* The reference hero IS the graphic below; the headline lives in the
              graphic, so the semantic h1 is visually-hidden but fully spoken
              (a11y gate: exactly one h1 per page, localized). */}
          <h1 className="sr-only">{headline}</h1>
          <Link
            href="/how-it-works"
            className="group relative block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <div className="relative aspect-[871/366] w-full overflow-hidden">
              <Image
                src="/original/hero-how-it-works.jpg"
                alt={alt}
                fill
                priority
                sizes="(min-width: 1200px) calc(min(100vw, 1200px) - 330px), 100vw"
                className="h-full w-full object-cover transition-transform duration-200 ease-standard group-hover:scale-[1.01]"
              />
            </div>
            <span className="absolute inset-x-4 bottom-4 inline-flex w-fit items-center gap-2 rounded-sm bg-ink px-4 py-2 font-body text-xs font-semibold text-white transition-colors duration-instant ease-standard group-hover:bg-ink-soft md:inset-x-auto md:bottom-6 md:left-6 md:text-sm">
              {cta}
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3.5">
                <path d="M3 8h9m0 0-3.5-3.5M12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}