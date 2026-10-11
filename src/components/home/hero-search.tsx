"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { getPathname } from "@/i18n/navigation";

/*
 * HeroSearch — the action zone of the ProcurementCommandStrip (§8.1).
 *
 * A plain GET form at the locale-aware search path: no JavaScript is needed
 * to search (SSR route does the work), JS only rotates the five §20 example
 * placeholders while the field is unfocused and stops the moment the reader
 * engages — typing replaces the rotation, focus replaces it, and the cycle
 * never resumes over the reader's own text. No loop the user didn't start,
 * no motion library: a text swap on a 3 s interval is not worth a runtime.
 */

interface HeroSearchProps {
  label: string;
  submitLabel: string;
  examples: string[];
}

export function HeroSearch({ label, submitLabel, examples }: HeroSearchProps) {
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const action = getPathname({ locale, href: "/search" });

  useEffect(() => {
    if (engaged || examples.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % examples.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [engaged, examples.length]);

  return (
    <form action={action} method="get" role="search" aria-label={label}>
      <label htmlFor="hero-search" className="type-label text-ink-muted">
        {label}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="hero-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder={examples[index]}
          onFocus={() => setEngaged(true)}
          className="h-12 min-w-0 flex-1 rounded-md border border-line bg-surface-elevated px-4 text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <button
          type="submit"
          className="h-12 shrink-0 rounded-md bg-brand-primary px-5 font-body text-sm font-semibold text-ink-on-signal transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
