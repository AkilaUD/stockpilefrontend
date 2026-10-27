import Image from "next/image";
import { StatusPill } from "@/components/ui/status-pill";
import { HomeComparisonPeak, type ComparisonRow } from "./home-comparison-peak";

export interface WorkflowStepView {
  state: string;
  title: string;
  body: string;
}

export interface HomeWorkflowScrollProps {
  eyebrow: string;
  title: string;
  lede: string;
  steps: WorkflowStepView[];
  example: {
    stamp: string;
    title: string;
    note: string;
    item: string;
    supplierHeader: string;
    unitPriceHeader: string;
    leadTimeHeader: string;
    totalHeader: string;
    rows: ComparisonRow[];
  };
  processImageAlt: string;
  deskImageAlt: string;
}

/**
 * Workflow scroll peak — server markup; pin/stagger owned by HomeMotion.
 * Desktop pin on `[data-workflow-pin]` (lg+ only).
 */
export function HomeWorkflowScroll({
  eyebrow,
  title,
  lede,
  steps,
  example,
  processImageAlt,
  deskImageAlt,
}: HomeWorkflowScrollProps) {
  return (
    <section data-workflow-pin data-home-reveal>
      <header className="max-w-2xl">
        <p className="type-label text-ink-muted">{eyebrow}</p>
        <h2 className="type-display-md mt-2 text-ink">{title}</h2>
        <p className="type-body mt-2 text-ink-muted">{lede}</p>
      </header>

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start">
        <ol className="grid min-w-0 gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.state}
              data-workflow-step
              className="rounded-lg border border-line bg-surface-panel p-4"
            >
              <span className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary font-display text-sm font-bold text-ink-on-signal">
                  {index + 1}
                </span>
                <StatusPill tone={index === steps.length - 1 ? "success" : "neutral"}>
                  {step.state}
                </StatusPill>
              </span>
              <h3 className="type-title-sm mt-3 text-ink">{step.title}</h3>
              <p className="type-body-sm mt-1 text-ink-muted">{step.body}</p>
            </li>
          ))}
          <li className="relative min-h-36 overflow-hidden rounded-lg sm:col-span-2">
            <Image
              src="/home/home-process-journey.jpg"
              alt={processImageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </li>
        </ol>

        <div className="flex flex-col gap-4">
          <HomeComparisonPeak {...example} />
          <div className="relative aspect-[16/8] overflow-hidden rounded-lg">
            <Image
              src="/home/home-buyer-desk.jpg"
              alt={deskImageAlt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
