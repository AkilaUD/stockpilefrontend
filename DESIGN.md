# Stockpile — Modern Construction Procurement design world

**Status:** Active direction (supersedes Material Ledger / Material Atlas).
**Product truth:** Live APIs, real catalogue, real RFQ → quote → order flows. No invented metrics.

## Concept — the structured procurement platform

Stockpile feels like a modern construction-supply business run on precise
digital tooling: a structural graphite header, an architectural grid,
signal-yellow used only where it carries function (primary action, active
state, key figure), and information-dense but calm operational surfaces.
No ledger ruling, stamps, folio numbering, or editorial-serif motifs.

| Register | Surfaces | Character |
|---|---|---|
| **Public** | Home, catalogue, PDP, suppliers, news, pricing, guides | Strong grotesque headlines, real material photography, clear search-first hierarchy |
| **Operational (private)** | Workspace, supplier desk, admin | Dense rows, compact type, status-first, low chrome |

## Brand DNA

- **Ink** `#141414` / soft `#2a2a2a` — structure, masthead, type
- **Signal** `#f0d60a` / soft `#e6b800` — primary CTAs and functional emphasis (fill, never body text on light)
- **Concrete** `#f4f4f1` page / `#ffffff` panels / `#e9e9e6` recessed
- **Danger** `#9e2219` — errors only
- **Status** — always text + tone (pill/badge); colour never speaks alone

No purple SaaS gradients, no glassmorphism, no emoji-as-icons, no generic
image-led hero, no repeated identical card sweeps, no fake metrics,
testimonials, ratings, or partner logos.

## Typography

- **Display:** Archivo — industrial grotesque headlines and section titles
- **UI / body:** Inter — navigation, forms, tables
- **Data voice:** IBM Plex Mono — SKUs, references, quantities, prices only (`--font-mono`; tabular)
- **Sinhala:** Noto Sans Sinhala in the body/display stacks for `/si`; uppercase label styling never applies to Sinhala copy

## Geometry

- Radii: 4px inputs/chips, 8px buttons/panels/cards, 12px dialogs/hero panels, full only for status pills/avatars.
- Elevation only on transient surfaces (dialogs, menus, popovers, sticky bars).
- 4px spacing base; public max 1280px, workspace max 1680px.

## Icons

Lucide React, consistent stroke/size. Icon-only controls need accessible names.

## Motion ownership

| Owner | Owns |
|---|---|
| **GSAP + ScrollTrigger** | Homepage hero entrance + one workflow sequence only. No blanket fade-ups, no scroll-jacking. |
| **Motion (`motion/react`)** | Menus, dialogs, drawers, toasts, list feedback |
| **CSS** | Hover, focus, simple colour transitions |

`prefers-reduced-motion: reduce` → final state, no timelines; Motion collapses via `MotionConfig`. GSAP never ships in workspace/supplier/admin chunks (bundle-budget enforced).

## Homepage rules

- Full-bleed photographic hero with a localized scrim (left/bottom), not a full-frame dark wash. Search usable immediately; primary CTA starts the materials list / RFQ flow.
- Visual-first rhythm: procurement ribbon → department photo mosaic → materials list → newest products → workflow scroll peak (labelled EXAMPLE comparison) → suppliers → FAQ → CTA.
- Counts come only from `GET /api/v1/catalog/summary`. Stock is a state, never a quantity. POR lines never enter a subtotal.
- Imagery must be real product/project assets tied to real entries — never fake suppliers, projects or prices.

## Tokens

`src/styles/tokens.css` (palette → semantic) → `src/app/globals.css` `@theme` utilities → `src/styles/typography.css` type roles. Components use semantic utilities only, never palette names.
