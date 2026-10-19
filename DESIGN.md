# Stockpile — Material Atlas design world

**Status:** Active redesign direction (supersedes Magento Martfury visual parity).  
**Product truth:** Live APIs, real catalogue, real RFQ → quote → order flows. No invented metrics.

## Concept

Two registers:

| Register | Surfaces | Character |
|---|---|---|
| **Editorial (public)** | Home, catalogue, PDP, suppliers, news, pricing, guides | Wide measure, strong display type, material photography, asymmetric section rhythm, restrained signal yellow |
| **Operational (private)** | Workspace, supplier desk, admin | Dense rows, compact type, status-first, low chrome |

## Brand DNA

- **Ink** `#141414` / soft `#2a2a2a` — structure, masthead, type
- **Signal** `#f0d60a` / soft `#e6b800` — primary CTAs and procurement emphasis (fill, never body text on light)
- **Paper** `#f7f5f0` page / `#ffffff` panels / `#ebe7df` recessed
- **Danger** `#9e2219` — errors only

No purple SaaS gradients, no glassmorphism, no emoji-as-icons.

## Typography

- **Display:** Source Serif 4 — editorial headlines
- **UI / body:** Source Sans 3 — navigation, forms, tables
- **Sinhala:** Noto Sans Sinhala in the body stack so `/si` never falls back to broken glyphs

## Icons

Lucide React, consistent stroke. Icon-only controls need accessible names.

## Motion ownership

| Owner | Owns |
|---|---|
| **GSAP + ScrollTrigger** | Homepage / marketing section timelines |
| **Motion (`motion/react`)** | Menus, dialogs, drawers, toasts |
| **CSS** | Hover, focus, simple colour transitions |

`prefers-reduced-motion: reduce` → no GSAP timelines; Motion collapses via `MotionConfig`.

## Bans

- Fake RFQ/call counters (API has `catalog/summary` only)
- Partner-buyer logo strip without assets
- Card-payment checkout
- Dead navigation / placeholder CTAs
- Mixing GSAP and Motion on the same transform properties

## Tokens

Source of truth: `src/styles/tokens.css` → Tailwind `@theme` in `src/app/globals.css`.
