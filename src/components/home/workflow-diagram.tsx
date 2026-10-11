/*
 * WorkflowDiagram — RFQ → suppliers → quotes as a ProcurementTrace (§6.1).
 *
 * A line with event nodes and big step numerals (mono). Horizontal on md+,
 * stacked on small screens — the line is decorative (`aria-hidden`), the
 * ordered list carries the semantics. Server Component; entrance handled by
 * the page's <Reveal> wrapper, not here.
 */

interface WorkflowStep {
  title: string;
  body: string;
}

export function WorkflowDiagram({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="absolute left-0 right-0 top-5 hidden h-px bg-line-strong md:block" />
      <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
      {steps.map((step, index) => (
        <li key={step.title} className="relative">
          <span aria-hidden="true" className="relative z-10 flex size-10 items-center justify-center rounded-full border-2 border-ink bg-brand-primary type-body font-mono font-semibold text-ink-on-signal">
            {index + 1}
          </span>
          <h3 className="type-title-sm mt-4 text-ink">{step.title}</h3>
          <p className="type-body mt-2 text-ink-muted">{step.body}</p>
        </li>
      ))}
      </ol>
    </div>
  );
}
