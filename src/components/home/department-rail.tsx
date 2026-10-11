import { Link } from "@/i18n/navigation";

/*
 * DepartmentRail — catalogue departments as MaterialLabel-motif tiles (§6.1).
 *
 * The physical-label treatment: thick ink border, mono index tab on signal
 * yellow, department name set plainly. No generic icon-above-heading cards —
 * the tab carries the order, the name carries the meaning. Server Component.
 */

interface DepartmentRailProps {
  departments: Array<{ slug: string; name: string }>;
}

export function DepartmentRail({ departments }: DepartmentRailProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {departments.map((dept, index) => (
        <li key={dept.slug}>
          <Link
            href={`/categories/${dept.slug}`}
            className="group flex h-full flex-col rounded-none border-2 border-ink bg-surface-panel transition-colors duration-instant ease-standard hover:bg-surface-recessed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="type-meta w-fit bg-brand-primary px-2 py-0.5 font-mono font-semibold text-ink-on-signal">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="type-body flex-1 px-4 py-3 font-medium text-ink group-hover:text-ink-accent">
              {dept.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
