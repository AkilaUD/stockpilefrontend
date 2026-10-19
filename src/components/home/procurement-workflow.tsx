import { Link } from "@/i18n/navigation";

/*
 * Honest buyer workflow — matches shipped RFQ → quote → order path.
 */

interface Step {
  label: string;
  title: string;
  body: string;
}

interface ProcurementWorkflowProps {
  title: string;
  lede: string;
  steps: Step[];
  ctaLabel: string;
  ctaHref: string;
}

export function ProcurementWorkflow({ title, lede, steps, ctaLabel, ctaHref }: ProcurementWorkflowProps) {
  return (
    <section className="border-y border-line bg-surface-recessed py-14 md:py-20" data-home-reveal>
      <div className="shell-public">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h2>
          <p className="mt-3 type-body text-ink-muted">{lede}</p>
        </div>

        <ol className="mt-10 grid gap-0 border-t border-line md:grid-cols-5">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className="border-b border-line py-6 md:border-r md:border-b-0 md:px-4 md:py-8 md:last:border-r-0"
            >
              <p className="type-label font-semibold tracking-[0.12em] text-ink-muted">
                {String(index + 1).padStart(2, "0")} · {step.label}
              </p>
              <h3 className="mt-3 type-title-sm font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 type-body-sm text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8">
          <Link
            href={ctaHref}
            className="type-body-sm font-semibold text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {ctaLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
