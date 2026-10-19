import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface CatalogueSearchFormProps {
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder: string;
  submitLabel: string;
  className?: string;
}

/** GET search form — server-rendered, no client state. */
export function CatalogueSearchForm({
  action,
  name = "q",
  defaultValue,
  placeholder,
  submitLabel,
  className,
}: CatalogueSearchFormProps) {
  const inputClasses =
    "h-11 min-w-0 flex-1 rounded-sm border border-line bg-surface-panel px-3 font-body text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  return (
    <form action={action} method="get" role="search" className={className ?? "flex w-full max-w-lg items-center gap-2"}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${inputClasses} pl-10`}
        />
      </div>
      <Button type="submit" size="md">
        {submitLabel}
      </Button>
    </form>
  );
}
