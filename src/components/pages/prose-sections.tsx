import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/cx";

/*
 * ProseSections — the shared renderer for the transcribed reference editorial
 * pages (reference reconstruction §4.4 / PARITY.md gap C).
 *
 * Those pages share one shape: a sequence of titled blocks whose body is
 * paragraphs, a bullet list, a definition list, a trailing note, and sometimes
 * an inline destination ("Supplier Registration page", "Add Products"). The
 * message files carry that shape as data (`pages.<key>.sections`), so the pages
 * themselves hold no English and every string stays in next-intl.
 *
 * Server Component. No state, no effects.
 */
export interface ProseLink {
  label: string;
  href: string;
}

export interface ProseDefinition {
  /** Term / cookie name — the left column of a definition list. */
  term: string;
  body: string;
}

export interface ProseSection {
  /** Section heading. Omitted for a lead-in block that runs straight after the lede. */
  title?: string;
  /** Body copy; a blank line (`\n\n`) starts a new paragraph. */
  body?: string;
  bullets?: string[];
  definitions?: ProseDefinition[];
  /** Closing note rendered after the bullets. */
  footer?: string;
  /** A real destination the reference names in this section. */
  link?: ProseLink;
}

/** Paragraphs are authored with a blank line between them. */
function paragraphs(text: string): string[] {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** External destinations are plain anchors; internal ones keep the locale. */
function ProseAnchor({ link, className }: { link: ProseLink; className?: string }) {
  const isExternal = /^https?:\/\//.test(link.href) || link.href.startsWith("mailto:");
  const classes = cx(
    "font-medium text-ink-accent underline decoration-from-font underline-offset-2 transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    className,
  );
  if (isExternal) {
    return (
      <a href={link.href} className={classes} rel="noreferrer">
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={classes}>
      {link.label}
    </Link>
  );
}

export function ProseSections({
  sections,
  headingLevel = "h2",
}: {
  sections: ProseSection[];
  /** The level to use — the guide shell already owns the page h1. */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <div className="space-y-10">
      {sections.map((section, index) => (
        <section key={section.title ?? `section-${index}`} className="measure-editorial">
          {section.title && (
            <Heading className="font-display text-base font-bold uppercase tracking-wide text-ink">
              {section.title}
            </Heading>
          )}

          {section.body && (
            <div className={cx("space-y-3", section.title && "mt-2")}>
              {paragraphs(section.body).map((paragraph) => (
                <p key={paragraph} className="type-body leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="type-body leading-relaxed text-ink-muted">
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {section.definitions && section.definitions.length > 0 && (
            <dl className="mt-3 space-y-3">
              {section.definitions.map((definition) => (
                <div key={definition.term}>
                  <dt className="font-display text-sm font-bold text-ink">{definition.term}</dt>
                  <dd className="mt-1 type-body-sm leading-relaxed text-ink-muted">
                    {definition.body}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {section.footer && (
            <div className="mt-3 space-y-3">
              {paragraphs(section.footer).map((paragraph) => (
                <p key={paragraph} className="type-body leading-relaxed text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {section.link && (
            <p className="mt-3">
              <ProseAnchor link={section.link} />
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
