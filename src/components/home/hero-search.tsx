"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Hero primary search — submits to the SSR /search route (same as command palette).
 */
export function HeroSearch() {
  const t = useTranslations("catalogue.command");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex overflow-hidden rounded-sm border border-line-strong bg-surface-elevated shadow-sm"
    >
      <label className="sr-only" htmlFor="hero-search">
        {t("placeholder")}
      </label>
      <div className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-ink-muted" aria-hidden="true" />
        <input
          id="hero-search"
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          autoComplete="off"
          className="h-12 w-full bg-transparent py-2 pr-3 pl-10 type-body text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      <Button type="submit" size="lg" className="rounded-none border-0 border-l border-ink">
        {tNav("searchSubmit")}
      </Button>
    </form>
  );
}
