"use client";

/*
 * CommandSearch — the masthead search overlay (design-system.md §6.1,
 * api.md §2.3 `/search/command`). "use client" for the obvious reasons: the
 * palette opens/closes, the query is debounce-fetched from the browser
 * (same-origin rewrite → the POST-only-free 60/min budget), and arrow keys
 * move an active row — Radix Dialog supplies the modal a11y: focus trap on
 * open, Escape, focus restore, scroll lock.
 *
 * The wire answers are rendered truthfully: grouped Products / Categories /
 * Suppliers with the backend's own labels and counts, an exact "see all"
 * link into the SSR `/search` route, and honest empty/error copy from the
 * message files (never fake results, spec §0.6).
 *
 * Keyboard: ↑/↓ move the active row across groups (wrapping), Enter opens it,
 * Escape dismisses. Rows are real anchors, so there is also a plain-tab path
 * with no state at all.
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { fetchCommandSearch, type CommandSearchResponse } from "@/lib/api/catalogue";
import { categoryHref } from "@/lib/navigation/navigation";
import { cx } from "@/lib/cx";

type OverlayState = "idle" | "loading" | "done" | "error";
type CommandGroup = "products" | "categories" | "suppliers";

interface ResultEntry {
  key: string;
  href: string;
  primary: string;
  secondary?: string;
}

const DEBOUNCE_MS = 200;

export function CommandSearch() {
  const t = useTranslations("catalogue.command");
  const tNav = useTranslations("nav");
  const tErr = useTranslations("errors");
  const tA11y = useTranslations("a11y");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<OverlayState>("idle");
  const [result, setResult] = useState<CommandSearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Debounced fetch. Stale answers are discarded via per-run AbortController;
  // the empty-query reset happens in `onChange` (an event handler), so the
  // effect body itself never calls setState synchronously.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") return;

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setState("loading");
      setActiveIndex(-1);
      try {
        const data = await fetchCommandSearch(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setResult(data);
        setState("done");
      } catch {
        if (controller.signal.aborted) return;
        setResult(null);
        setState("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const entries: ResultEntry[] = [];
  if (result) {
    for (const product of result.products) {
      entries.push({
        key: `p-${product.publicId}`,
        href: `/products/${product.slug}`,
        primary: product.name,
        secondary: product.supplier.name,
      });
    }
    for (const category of result.categories) {
      entries.push({
        key: `c-${category.slug}`,
        href: categoryHref(category.slug),
        primary: category.name,
      });
    }
    for (const supplier of result.suppliers) {
      entries.push({
        key: `s-${supplier.publicId}`,
        href: `/suppliers/${supplier.slug}`,
        primary: supplier.name,
      });
    }
  }

  const trimmed = query.trim();
  const hasResults = state === "done" && entries.length > 0;

  const groups: Array<{ key: CommandGroup; entries: ResultEntry[] }> = result
    ? [
        { key: "products", entries: entries.filter((entry) => entry.key.startsWith("p-")) },
        { key: "categories", entries: entries.filter((entry) => entry.key.startsWith("c-")) },
        { key: "suppliers", entries: entries.filter((entry) => entry.key.startsWith("s-")) },
      ]
    : [];

  const onArrow = (direction: 1 | -1) => {
    if (entries.length === 0) return;
    setActiveIndex((current) => (current + direction + entries.length) % entries.length);
  };

  const onEnter = () => {
    if (activeIndex >= 0 && activeIndex < entries.length) {
      window.location.assign(entries[activeIndex].href);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t("trigger")}
          className="inline-flex h-11 w-full items-center gap-2 rounded-sm bg-surface-elevated px-4 text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden truncate text-sm xl:inline">{tNav("searchPlaceholder")}</span>
          <span className="ml-auto hidden items-center rounded-sm bg-brand-primary px-3 py-1.5 font-body text-xs font-semibold text-ink-on-signal xl:inline-flex">
            {tNav("searchSubmit")}
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="command-content rounded-md border border-line bg-surface-elevated shadow-elev-lg outline-none">
          <div role="search">
            <div className="flex items-center gap-3 px-6 py-3.5">
              <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  if (next.trim() === "") {
                    setResult(null);
                    setState("idle");
                    setActiveIndex(-1);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    onArrow(1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    onArrow(-1);
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    onEnter();
                  }
                }}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                autoFocus
                className="h-11 w-full bg-transparent font-body text-base text-ink outline-none placeholder:text-ink-muted"
              />
              <DialogPrimitive.Close
                aria-label={tA11y("closeDialog")}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors duration-instant ease-standard hover:bg-surface-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <X className="size-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="border-t border-line px-6 py-5">
            {state === "idle" && <p className="type-body text-ink-muted">{t("empty")}</p>}

            {state === "loading" && <p className="type-body text-ink-muted">{t("loading")}</p>}

            {state === "error" && <p className="type-body text-ink-muted">{tErr("unexpectedNoReference")}</p>}

            {state === "done" && !hasResults && (
              <p className="type-body text-ink-muted">{t("noResults", { query: trimmed })}</p>
            )}

            {state === "done" && entries.length > 0 && (
              <div className="space-y-5">
                {groups.map((group) => {
                  if (group.entries.length === 0) return null;
                  return (
                    <section key={group.key}>
                      <h2 className="block-title">{t(group.key)}</h2>
                      <ul className="mt-2 space-y-1">
                        {group.entries.map((entry) => {
                          const index = entries.indexOf(entry);
                          const active = index === activeIndex;
                          return (
                            <li key={entry.key}>
                              <Link
                                href={entry.href}
                                onClick={() => setOpen(false)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cx(
                                  "block rounded-sm px-3 py-2 transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                                  active ? "bg-brand-primary text-ink-on-signal" : "text-ink hover:bg-surface-panel",
                                )}
                              >
                                <span className="type-body block font-medium">{entry.primary}</span>
                                {entry.secondary && <span className={cx("type-meta block", active ? "text-ink-on-signal" : "text-ink-muted")}>{entry.secondary}</span>}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}

            {trimmed !== "" && (
              <Link
                href={`/search?q=${encodeURIComponent(trimmed)}`}
                onClick={() => setOpen(false)}
                className="mt-5 inline-block type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {t("seeAll", { query: trimmed })}
              </Link>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}