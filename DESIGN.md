# Stockpile — Material Ledger design world

**Status:** Active direction (supersedes Material Atlas editorial homepage; Atlas registers remain for catalogue/PDP/editorial surfaces).
**Product truth:** Live APIs, real catalogue, real RFQ → quote → order flows. No invented metrics.

## Concept — the opened order book

The homepage is not a landing page. It is a ruled ledger that is already open
and already working: a cover page (folio №, purpose, search, one buyer action),
a pre-filled live sheet the visitor can add from, and a materials-list builder
that becomes the RFQ. Every later section is a page of the same book — numbered
material index, current register, document-state workflow, supplier desk,
annex of field notes.

Two registers:

| Register | Surfaces | Character |
|---|---|---|
| **Ledger (homepage + procurement)** | Home, RFQ builder/form | Folio numbers, entry numbers, ruled rows, stamps, totals; IBM Plex Mono data voice |
| **Editorial (public)** | Catalogue, PDP, suppliers, news, pricing, guides | Wide measure, strong display type, material photography, restrained signal yellow |
| **Operational (private)** | Workspace, supplier desk, admin | Dense rows, compact type, status-first, low chrome |

## Brand DNA

- **Ink** `#141414` / soft `#2a2a2a` — structure, masthead, type
- **Signal** `#f0d60a` / soft `#e6b800` — primary CTAs and procurement emphasis (fill, never body text on light)
- **Paper** `#f7f5f0` page / `#ffffff` panels / `#ebe7df` recessed
- **Danger** `#9e2219` — errors only
- **Ledger stamps** — state (`IN STOCK`, `ACCEPTED`) always as text inside a rotated bordered stamp; colour never speaks alone

No purple SaaS gradients, no glassmorphism, no emoji-as-icons, no generic
image-led hero, no repeated card sweeps on the homepage.

## Typography

- **Display:** Source Serif 4 — editorial headlines (ledger cover statement only on home)
- **UI / body:** Source Sans 3 — navigation, forms, tables
- **Data voice:** IBM Plex Mono — SKUs, entry numbers, quantities, prices, folio references (`--font-mono`; Sinhala falls back to Noto Sans Sinhala in the mono stack)
- **Sinhala:** Noto Sans Sinhala in the body stack so `/si` never falls back to broken glyphs; uppercase label/stamp styling never applies to Sinhala copy

## Icons

Lucide React, consistent stroke. Icon-only controls need accessible names.

## Motion ownership

| Owner | Owns |
|---|---|
| **GSAP + ScrollTrigger** | Homepage ledger motion only: entry lines write in, stamps land, totals draw. No blanket fade-ups. |
| **Motion (`motion/react`)** | Menus, dialogs, drawers, toasts |
| **CSS** | Hover, focus, simple colour transitions |

`prefers-reduced-motion: reduce` → final ledger state, no timelines; Motion collapses via `MotionConfig`.

## Homepage rules

- The department side-nav (≥1200px, 300px rail) is structural: the hero reserves its gutter; flyouts may overlay only the live sheet, never headline/search/actions.
- Counts come only from `GET /api/v1/catalog/summary`. Stock is a state, never a quantity. POR lines never enter a subtotal.
- AI imagery may appear only as captioned ledger plates tied to a real entry/department/process state — never as fake suppliers, projects or prices.

## Bans

- Fake RFQ/call counters (API has `catalog/summary` only)
- Partner-buyer logo strip without assets
- Card-payment checkout
- Dead navigation / placeholder CTAs
- Mixing GSAP and Motion on the same transform properties
- Invented KPIs, testimonials or savings claims

## Tokens

Source of truth: `src/styles/tokens.css` → Tailwind `@theme` in `src/app/globals.css`. Ledger tokens: `--ledger-*`, `--layout-department-rail`, `--layout-home-max`.
