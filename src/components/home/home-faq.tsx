import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";

/*
 * Homepage FAQ — answers grounded in the real RFQ → quote → order flow
 * and the live pricing model. Native details/summary: keyboard-safe.
 */

interface FaqItem {
  question: string;
  answer: string;
}

interface HomeFaqProps {
  title: string;
  items: FaqItem[];
  helpLabel: string;
}

export function HomeFaq({ title, items, helpLabel }: HomeFaqProps) {
  if (items.length === 0) return null;

  return (
    <section className="shell-public border-b border-line py-12 md:py-16" data-home-reveal>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h2>
          <p className="mt-4">
            <Link
              href="/help"
              className="type-body-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {helpLabel}
            </Link>
          </p>
        </div>
        <div className="lg:col-span-8">
          {items.map((item) => (
            <details key={item.question} className="group border-b border-line py-4 first:pt-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 type-title-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  className="size-4 shrink-0 transition-transform duration-instant ease-standard group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 max-w-2xl type-body-sm text-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
