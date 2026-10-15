import { REFERENCE_ICONS, type ReferenceIconGlyph, type ReferenceIconName } from "@/lib/reference-icons";
import { cx } from "@/lib/cx";

/*
 * ReferenceIcon — one inline SVG per glyph the original theme draws.
 *
 * The reference renders its icons as an icon font (`<i class="mbi mbi-*">`,
 * 77 uses / 22 distinct glyphs on the home page, measured 2026-10-14). This
 * application ships no icon font: the same glyphs are inlined from the open
 * Font Awesome Free set, keyed by the reference's own class names so the
 * mapping is auditable (frontend/src/lib/reference-icons.ts).
 *
 * Decorative by default — callers own the accessible name, exactly as the
 * reference's `<i>` glyphs require a label from their own anchor.
 */
export function ReferenceIcon({
  name,
  className,
}: {
  name: ReferenceIconName;
  className?: string;
}) {
  const icon: ReferenceIconGlyph = REFERENCE_ICONS[name];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={icon.viewBox}
      fill="currentColor"
      className={cx("shrink-0", className)}
    >
      {icon.paths.map((path) => (
        <path
          key={path.d.slice(0, 24)}
          d={path.d}
          fillRule={path.rule === "evenodd" ? "evenodd" : undefined}
        />
      ))}
    </svg>
  );
}
