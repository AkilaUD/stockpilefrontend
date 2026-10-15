# Parity audit — reconstruction vs live https://stockpile.lk/

Audited **2026-10-14**; gaps **A**, **B** and **C** closed in the same pass (see §8). This document
compares this application against the live reference site item by item, so "full parity" is a list of
measured facts rather than an impression. Nothing here is guessed: every reference value was read
from the live DOM, the reference sitemaps, or a prior measurement already recorded in
`RECONSTRUCTION-NOTES.md` (B17).

## Method and evidence

- **Live measurement** of the reference with Playwright at 1440px and 768px, one request every few
  seconds (reference `robots.txt` carries `Crawl-delay: 10`). Pages: `/en/` (home, ×2 widths),
  `/en/electrical.html` (category), `/en/icc-durra-standard-dry-wall-panel.html` (product),
  `/en/pricing`, `/en/` sections pass. Full JSON in `tests/parity/`.
- **Route inventory** from both reference sitemaps (`sitemap.xml`, `sitemap_si_LK.xml`, 5 790 URLs
  deduped) → `tests/parity/ref-routes.txt`.
- **Reference copy capture** for gap C: every editorial route in both locales, as rendered HTML and
  as extracted text → `tests/ref-content/{en,si}-*.json` + `.txt` (38 pages), the 28 spec tables →
  `tests/ref-content/spec-tables.json`, the raw spec page → `tests/ref-content/spec-page.html`.
- **Our side** read from source: `src/app/**/page.tsx`, `src/lib/navigation/navigation.ts`,
  `src/messages/{en,si}.json`, `src/styles/tokens.css`, `src/styles/typography.css`,
  `src/components/layout/{site-header,site-footer}.tsx`.
- **Rendered vs source case, measured.** On `/user-guide-glossary` the reference's group headings are
  uppercased by CSS (`innerText` reads `CUTTING/GRINDING WHEELS`, `textContent` reads
  `Cutting/Grinding Wheels`, computed `text-transform: uppercase`), whereas the specification page's
  headings are genuinely mixed case (`text-transform: none`). Our pages reproduce the reference's
  *rendered* text in both cases.
- **Browser gate.** `tests/e2e/` (Playwright, 24 specs in 6 files) drives every route against the
  production standalone build and the real Kestrel API. The editorial spec's expectations come only
  from `tests/ref-content/` — no invented strings. Added this pass: `editorial.spec.ts` (gap C) and the
  `EDITORIAL_ROUTES` overflow case in `responsive.spec.ts`.
- Probe scripts are kept as audit tools: `tests/parity-probe.mjs`, `parity-home-sections.mjs`,
  `parity-routes.mjs`, `parity-digest.mjs`, `ref-content.mjs`, `ref-content-format.mjs`,
  `ref-spec-tables.mjs`, `ref-spec-html.mjs`, `ref-call-cimco.mjs`, `gen-spec-data.mjs`.

## 1. Verdict

| Layer | State |
|---|---|
| Typeface, palette, page ground | **Match** — Open Sans; `#020202` ink; `#f6e71d` signal; white page. |
| Layout container | **Match (A)** — reference caps content at **1200px** with **15px** gutters; ours now does too (`shell-public`). |
| Header | **Match in structure** — 3 rows (top bar / masthead / menu row), same order, same destinations. The department block is now container-aligned. |
| Footer | **Match** — 4 columns (Contact Us / Stockpile / Company / Support), same links and socials, all on reference paths. |
| Home page | **Match in section order**, with one addition (Stats band — not in the reference) and one omission (News). |
| Routes | **Match (B + C)** — the whole reference editorial/utility set is served on the reference's own paths (old paths 308-redirect). Two routes are deliberately absent (§6). |
| Category / product templates | **Match in capability**; URL scheme differs by design (`/categories/{slug}` vs `/…​.html`). |

The reconstruction is faithful where it consumes real data (catalogue, auth, RFQ, suppliers), and the
editorial surface now transcribes the reference's own copy rather than paraphrasing it. The remaining
distance to "full parity" is the News surface (no data source here) and two reference routes that
describe concepts this backend does not have (§6).

## 2. Global tokens and layout (measured @1440 on the reference)

| Item | Reference | Ours | Verdict |
|---|---|---|---|
| Body font | `"Open Sans","Segoe UI","Helvetica Neue"` | Open Sans via `next/font` (`--font-body`) | match |
| Body size / colour / ground | 16px / `rgb(2,2,2)` / `#fff` | `--type-body` 1rem / `--ink #020202` / `--surface-page #fff` | match |
| Container max-width | **1200px** (720px @768) | **1200px** (`--layout-max-public`) | **match (A)** |
| Container padding | **15px** | **15px** (`--layout-gutter-public: 0.9375rem`) | **match (A)** |
| Menu flip point | 1200px (`col-lg`) | 1200px (`@utility department-block`) | match (B17) |
| Section `h2` | 24px / 500 `#020202` | `text-2xl leading-8 font-medium` — 24px / 500 `#020202` | **match (skin)** |
| Category `h1` | 24px / 400 | `type-display-md` clamp (visually larger) | deviation (unchanged; the home skin pass did not touch editorial h1s) |
| Product name | 14px / 400 `#8f8b9c` | 14px / 400 `#6b7280` (`text-ink-muted`) | size match; colour is AA-safe on purpose — see §5b |
| Product price in a grid cell | *(the reference's cell carries no price)* | 14px / 600 `text-ink` | n/a — our cell carries the price the API returns |
| Primary button | bg `#f6e71d`, text `#020202`, radius 3px, weight 500, 1px `#020202` top/bottom rules, pad `5px 15px` | same colours, `rounded-[3px]`, `font-medium`, `border-y border-ink`, `px-[15px]` | **match (skin)**; heights stay ours (44px vs the reference's 38px, WCAG target size) |

**The container width was the single largest visible deviation; A closed it.** At a 1440px viewport
the reference renders 1200px of content centred (content edge x=135) and so do we. The 15px gutter is
a public-shell-only token: the overlays and `shell-workspace` keep `--layout-gutter`, because they
have their own measurements and are not part of the reference's public frame.

## 3. Header — reference structure (measured, 1440×180)

| Row | Reference class | Height | Contents (reference destinations) |
|---|---|---|---|
| 1. Top bar | `.header-top-inner` | 38px | tagline "Construction Material Procurement Platform"; **Get Quotes** → `/quotations-and-estimations`; **Pricing** → `/pricing`; **Supplier List** → `/marketplace/seller/sellerlist/`; **English / සිංහල** |
| 2. Masthead | `.header-main-content.sticky-menu` | 92px | logo → `/`; "Shop By Department" trigger; cart → `/checkout/cart/` |
| 3. Menu row | `.header-menu-content` (≥768px) | 50px | **Get Quotes** → request-quote; **How It Works** → `/how-it-works`; **News** → `/news`; **About Us** → `/about-us`; **Help** → `/help` |
| Mobile | `.col-btn-actions` (<768px) | — | Menu / Search / Home / My Order / Me |

Our header (`site-header.tsx`) renders the same three rows and the same destinations, mapped to our
routes:

| Reference link | Reference href | Ours | Verdict |
|---|---|---|---|
| Get Quotes (top) | `/quotations-and-estimations` | `/quotations-and-estimations` | **match (B)** |
| Pricing | `/pricing` | `/pricing` | match |
| Supplier List | `/marketplace/seller/sellerlist/` | `/suppliers` | different path, same page |
| Get Quotes (hub) | request-quote | `/rfq` | match in intent |
| How It Works | `/how-it-works` | `/how-it-works` | match |
| News | `/news` | — | **omitted** (no data source) |
| About Us | `/about-us` | `/about-us` | match |
| Help | (help) | `/help` | match |

Known fidelity gaps already recorded (not regressions):
- ~~The department block sits at the viewport edge (x=0) in ours, vs x=135 (inside the 1200px
  container) in the reference.~~ **Closed by A**: at a 1280px viewport the block and its list start
  at x=55 — the container's content edge, `(1280 − 1200)/2 + 15` — and the hero image starts at
  x=355, exactly the list's right edge. `tests/e2e/home-departments.spec.ts` pins both.
- The reference hides the persistent department list when the header is sticky; ours reproduces
  this (B17).

## 4. Home page — section order

Reference order (measured 2026-10-14, headings at their y-offset):

| # | Reference section | Ours | Verdict |
|---|---|---|---|
| 1 | Hero banner `.banner-slider-top` 1170×414 | Hero banner | match |
| 2 | **Most Searched Products** (6-tile slider, 1170×264) | Most Searched (6 tiles) | match |
| — | *(no reference equivalent)* | **Stats band** (Products/Suppliers/Departments/Categories) | **addition** |
| 3 | **Featured Products** (product carousel) | Featured Products (newest slice, p.1) | match in slot |
| 4 | **Newest Suppliers** (carousel) | Newest Suppliers (text roster) | match in slot (no logo field in API) |
| 5 | **Become a Supplier** `.block-banner-05` | Become a Supplier band | match |
| 6 | **Newest Products** (carousel) | Newest Products (newest slice, p.2) | match |
| 7 | **News** `.blog-home5` (13-post slider) | — | **omitted** (no data source) |

So the home content is in the right order; the only structural differences are the extra Stats band
and the absent News section.

## 5. Footer (measured)

Reference `.page-footer` is white, 492px tall, four columns — reproduced exactly:

| Column | Reference links | Ours | Verdict |
|---|---|---|---|
| Contact Us | `info@stockpile.lk`; LinkedIn / facebook / instagram / youtube | same email + same four socials (glyphs) | match |
| Stockpile | How It Works · Supplier Benefits (`/how-it-works-for-suppliers`) · Register As A Supplier (`/pricing`) | `/how-it-works` · `/how-it-works-for-suppliers` · `/pricing` | **match (B)** |
| Company | About Us · Contact · Terms of Use | `/about-us` · `/contact` · `/terms-of-use` | match |
| Support | User Guide (`/user-guide`) · Sitemap (`/sitemap/sitemap.xml`) | User Guide (`/user-guide`) · Sitemap (`/sitemap/sitemap.xml`) | **match (B + C)** |

The Sitemap link is the reference's literal `.xml` target: our footer renders it as a plain `<a>`
(not a locale-aware `<Link>`), because `/sitemap/sitemap.xml` is a route handler outside the
`[locale]` tree. The four new editorial groups are **not** in the reference footer, so they are not
in ours either — the sitemap page and the XML sitemap are what advertise them.

## 5b. The reference's own skin — visual pass (measured 2026-10-14)

The owner's instruction for this pass: on the public surface the reference's own styles, icons and
colours win over our skin. Every value below was measured on the live site at 1440px
(`tests/skin-probe.mjs`, `detail-probe.mjs`, `extra-probe.mjs`, `extra2-probe.mjs` → the captures in
`tests/audit/*.json`), then re-measured on our standalone build reading the same boxes
(`tests/ours-probe.mjs` → `tests/audit/ours-skin.json`). "Ours now" is the measured value, not the
intent.

| Item | Reference | Ours now | Verdict |
|---|---|---|---|
| Header rows | 38 / 92 / 50 (+1px rules) = **180px** | 38 / 92 / 52 = **182px** | match (the 2px are the menu row's own two 1px borders) |
| Top bar | `#f6e71d`, 13px `#020202` | `bg-brand-primary`, 13px `text-ink` | match |
| Masthead links | 14px / 400 | 14px / 400 `text-sm` | match |
| Main-nav links | 16px / 500 `#020202`, 20px gaps | 16px / 500 `text-ink`, `gap-5` | match |
| Department trigger | 300×50, `padding: 10px 0`, transparent, no glyph (its label was `p` in the theme) | same, text-only `<button>`/`<p>` | match |
| Department list | 300px, white, `padding: 15px 0 14px`, 1px `#d3d3d3` bottom, rows 16px/400 black `padding: 9px 15px`, 20px row icons, hover `#f6e71d` | same (12 backend departments vs the reference's 10) | match |
| Flyout rows | level-1 `a`: 16px/400 `capitalize`, `padding: 10px 0`, 1px bottom, `li` inset 15px | same | match |
| Section header | `.top-title` `padding: 5px 20px`; heading 24px/500 `#020202` as a link; "View All" 16px/400 right | same (`px-5 py-[5px]`, `text-2xl leading-8 font-medium`, `text-base`) | match |
| Section rhythm | 30px between sections | `pb-[30px]` | match |
| Product cell | square 163×163 image, no border/radius, title 14px/400, **no price/CTA/border** | square image (measured **163px** at 1440, six across), no border/radius, title 14px/400 | match |
| Footer | `border-top` 1px `#e1e1e1`, `padding-top: 50px`; titles 16px/500 `#666666`; links 16px/400 `#020202`; columns 4/3/2/3; socials 16px in brand colours; copyright 14px/400 `#020202` | all of the above (measured) | match |
| Buttons | radius 3px, weight 500, 16px, 1px ink rules | `rounded-[3px]`, `font-medium`, `border-y border-ink` | match in form; height stays 44px (see below) |

Home page height came down from 4292px to ~3643px against the reference's 3514px; the remainder is the
hero graphic's aspect (ours 870×366 from the original flyer) plus our two added bands (§4).

**The templates we mirror** (same pass, `tests/template-probe.mjs` → `tests/audit/template.json`,
measured on `/en/building-materials.html` and `/en/mm-distributors-tv-wall-installation.html` — a real
category and a real product, both extracted from the reference home's own links):

| Item | Reference | Ours now | Verdict |
|---|---|---|---|
| Page title (`.page-title`) | 24px / 400, 33px line, `#020202`, `capitalize` | `page-title` utility — same five values | match |
| Block title (`.block-title`) | 16px / 400, 22px line, `#020202`, **UPPERCASE** | `block-title` utility — same | match |
| Breadcrumbs | 14px / 400, crumb links `#0099cc` | 14px / 400, muted ink | size match; link colour is the AA-safe muted ink (see deviation 7) |
| Product price | 24px / 500 `#020202`, 24px line | `text-2xl leading-6 font-medium text-ink` | match |
| Product-detail section heading | 20px / 500 (the reference's tab/accordion rows) | `text-xl font-medium text-ink` | match |
| SKU / attribute value | 16px / 400, value `#999999` | 16px / 400 `text-ink-muted` | size match; AA-safe grey |
| Option/field label | 12px / 400 `#666666` | `type-label` (11px) on our own forms | left as the design system's; the measured 12px is inside our 11–12px range |

Both voices live once, in `globals.css`, as the `page-title` and `block-title` utilities — the five
templates that carry them cannot drift apart, and the provenance comment sits with the rule.

**Deviations kept, each deliberate:**

1. **Product-title colour.** The reference paints `.product-item-link` `#8f8b9c` — 3.5:1 on white, below
   AA at 14px. Ours uses the design system's AA-safe muted ink `#6b7280` (4.6:1). Same size, same
   weight, same position; only the grey is one step darker.
2. **Footer link hover.** The theme hovers footer links to its signal yellow *as text* —
   `#f6e71d` on `#fff` is ≈1.1:1, i.e. the link effectively disappears under the pointer. Ours hovers
   to an underline. (The yellow hover is kept everywhere it is legible, e.g. a yellow *fill* behind
   black text in the department rows.)
3. **Primary-button height.** The reference's button is 38px tall; ours stays 44px so every action
   clears WCAG 2.2 §2.5.8 target size with room to spare. The skin (radius, weight, rules, padding,
   colours) is the reference's.
4. **Font stack.** The reference *declares* `"Open Sans","Segoe UI","Helvetica Neue"` but ships no
   webfont, so a Windows visitor sees Segoe UI. Ours self-hosts Open Sans through `next/font`, so the
   face the theme names is the face that renders. Open — see §9.
5. **Icons.** Rebuilt from an open set rather than vendored — see §5c.
6. **Our own home bands.** The Stats band and the supplier story strip have no reference equivalent
   (§4) and keep our design system's voice; they are the only blocks on the public home that are not
   measured off the reference.
7. **The reference's link blue.** The reference's theme paints body links `#0099cc` — 2.9:1 on white,
   below AA for text. Breadcrumb links and in-body links therefore keep the design system's muted ink
   (`#6b7280`, 4.6:1) or plain ink, while the breadcrumb keeps the reference's own 14px size.
8. **News bucket and tag pages filter.** The reference's own category listing ignores its filter:
   `.../en/news/category/suppliers` is headed "Suppliers" and lists the six *Completed Projects* posts
   the index opens with (captured: `tests/ref-content/news/category-suppliers.json`). Ours applies it,
   because a URL that names a bucket must mean that bucket; a bucket with no posts renders the empty
   state, and a tag — which exists only through its posts — is not a page without them.

### 5c. Icons

The reference draws every glyph from MageBig's commercial `mbicon` webfont (`mbi-*` class names). That
font cannot be vendored. Instead the 22 glyphs the reference actually uses were rebuilt from
**Font Awesome Free 6.7.2** (open — SIL OFL 1.1 for the font, CC BY 4.0 for the icons) into
`frontend/src/lib/reference-icons.ts` by `tests/gen-reference-icons.mjs`, keyed by the reference's own
`mbi-*` names, and drawn by `frontend/src/components/ui/reference-icon.tsx`. The brand glyphs land on
Font Awesome's codepoints, which are the reference's too (linkedin U+F0E1, facebook U+F09A,
instagram U+F16D, youtube U+F167). Licence and attribution live in the generated file's header.

## 6. Route inventory

Reference editorial/utility routes (from the sitemaps, `/en/` + `/si/`, excluding ~90 seller-shop
URLs) vs ours. The news tree is listed separately below: the sitemap under-reports it, so it was walked
by paging instead (13 index pages, 73 linked posts / 72 live / 71 captured — RECONSTRUCTION-NOTES.md).

| Reference route | Ours | Verdict |
|---|---|---|
| `/` | `/` | match |
| `/how-it-works` | `/how-it-works` | match |
| `/how-it-works-for-buyers` | `/how-it-works-for-buyers` | **transcribed (C)** |
| `/how-it-works-for-suppliers` | `/how-it-works-for-suppliers` | **match (B)** |
| `/about-us` | `/about-us` | match |
| `/contact` | `/contact` | match |
| `/pricing` | `/pricing` | match |
| `/quotations-and-estimations` | `/quotations-and-estimations` | **match (B)** |
| `/user-guide` | `/user-guide` | **transcribed (C)** — `/help` remains our FAQ |
| `/user-guide-supplier-registration` | `/user-guide-supplier-registration` | **transcribed (C)** |
| `/user-guide-product-creation` | `/user-guide-product-creation` | **transcribed (C)** |
| `/user-guide-product-specifications` | `/user-guide-product-specifications` | **transcribed (C)**, 28 tables |
| `/user-guide-supplier-quotation` | `/user-guide-supplier-quotation` | **transcribed (C)** |
| `/user-guide-customer-creating-rfqs` | `/user-guide-customer-creating-rfqs` | **transcribed (C)** |
| `/user-guide-customer-viewing-quotations` | `/user-guide-customer-viewing-quotations` | **transcribed (C)** |
| `/user-guide-glossary` | `/user-guide-glossary` | **transcribed (C)** |
| `/careers` | `/careers` | **transcribed (C)** — links to the operator's real Odoo jobs board |
| `/return-policy` | `/return-policy` | **transcribed (C)** |
| `/data-deletion-instructions` | `/data-deletion-instructions` | **transcribed (C)** |
| `/conversion-tables` | `/conversion-tables` | **transcribed (C)** |
| `/call-cimco` | — | **N/A** — the reference page is an unwired demo placeholder (§6.1) |
| `/special-offers` | — | **omitted** — no discount concept in the backend (§6.1) |
| `/newest-products` | `/newest-products` | **route added (C)** — rendered from our own catalogue, newest first |
| `/privacy-policy-cookie-restriction-mode` | `/privacy-policy-cookie-restriction-mode` | **transcribed (C)** |
| `/terms-of-use` | `/terms-of-use` | match |
| `/sitemap/sitemap.xml` | `/sitemap/sitemap.xml` | **match (B)** — a real XML route handler; `/sitemap` is our HTML sitemap |
| `/news` | `/news` | **match (2026-10-14)** — the migrated tree: 71 posts, six a page, full bodies |
| `/news/post/{slug}` | `/news/post/[slug]` | **match** — the reference's own trail (Home / News / bucket / title), bucket, date, tags and body |
| `/news/category/{slug}` | `/news/category/[slug]` | **match, and filtered where the reference's own page is not** (deviation 8) |
| `/news/tag/{slug}` | `/news/tag/[slug]` | **match** — the reference's own tag-chip destinations |
| `/marketplace/seller/sellerlist/` + seller profiles | `/suppliers`, `/suppliers/[slug]` | equivalent |
| `/{dept}.html`, `/{dept}/{sub}.html` | `/categories/{slug}` | different scheme |
| `/{product}.html` | `/products/[slug]` | different scheme |
| `/home`, `/home-05`, `/home-onecolumn`, `/mbi-font-icon`, `/no-route`, `/no-route-404` | — | **N/A** — Magento theme demos / 404 fixtures |

Old paths are 308 (permanent) redirects to the new ones, preserving the query string, via
`next.config.ts` `redirects()` — which runs before the next-intl proxy, so it is safe with
`localePrefix: "as-needed"` in both locales:

| Old path | New path |
|---|---|
| `/quotations`, `/si/quotations` | `/quotations-and-estimations`, `/si/quotations-and-estimations` |
| `/supplier-benefits`, `/si/supplier-benefits` | `/how-it-works-for-suppliers`, `/si/how-it-works-for-suppliers` |

Routes we have that the reference does not, all justified by real backend surfaces:
`/help` (our FAQ), `/rfq`, `/search`, `/suppliers` (directory), `/workspace`, `/wizard` (the four-step
buyer setup), `/admin`, `/supplier`, `/supplier/setup/*` (the three-step supplier setup), `/verify-email`,
`/reset-password`, `/forgot-password`, `/supplier-register`, `/supplier-login`, and the localized 404
catch-all.

The auth surface is ours, not the reference's (the reference runs a Magento customer form), and its
state is never invented for appearance: every field posts to a real endpoint. Since 2026-10-14 the buyer
and supplier registration forms autosave their **non-secret** prefill to a server-side registration draft
and resume from an opaque `draftToken` (residual #4a, api.md §2.1). The reference's forms have no
equivalent, so the refill is a deliberate addition on our own surface — reasoned in
`RECONSTRUCTION-NOTES.md`. The same is true of the buyer's four-step account setup (`/wizard/*`, residual
#4b) and the supplier's three-step one (`/supplier/setup/*`, residual #4c): each step is an independent,
resumable call against its own endpoint, and none of it appears on the reference's public surface to
copy. The supplier's version reads its stage back from `GET /suppliers/me` and is inert until that read
settles, so leaving and returning refills from the server rather than from browser state.

### 6.1 The two routes not reconstructed

- **`/special-offers`** — the reference route exists, but there is no discount, special-price or
  compare-at-price concept anywhere in this backend (`grep` for `SpecialPrice|CompareAtPrice|Discount`
  across `backend/**/*.cs`: no matches). Rendering it would mean inventing a promotion surface, so it
  is omitted and the dependency is recorded — the same treatment as the reference's "OUR PARTNERED
  BUYERS" logo strip.
- **`/call-cimco`** — captured and inspected (`tests/ref-call-cimco.mjs`): the reference page is an
  unwired demo stub — `<div class="hotline-top">` containing
  `<strong id="askhotline">Click to Call</strong>` with an empty `onmouseover=""`, no `tel:` href and
  no number. There is nothing to link to, so it is classified N/A alongside the theme demo pages.

### 6.2 Editorial copy is the reference's, in both locales

Every transcribed page carries the reference's own wording, including its typos ("Fiters",
"specifciations", "arragements", "withold", "verifciation"). Two measured facts shaped how they are
served:

- The reference's `/si/` editorial pages serve **English** — captured `/si/*` pages are
  character-for-character the same as their `/en/` twins for all 19 routes. Our editorial pages do
  the same, rather than inventing Sinhala legal/commercial text.
- The two exceptions are `/si/quotations-and-estimations` and `/si/newest-products`, whose Sinhala
  titles the reference does localize; ours uses the localized headings there too.
- The reference's group headings on the shared guide body are uppercased by CSS, so `screws` in its CMS
  reads as `SCREWS` on screen; we store and render that uppercase text. The reference also emits those
  headings as H3 under its H1 (a skipped level) where we render H2 — both deliberate, both recorded in
  `RECONSTRUCTION-NOTES.md`.
- The guide's "Stockpile for Suppliers" listing heading is itself a link to
  `/user-guide-supplier-registration` in the reference (capture `en-user-guide.json` → `links`), and it
  is one here too.

`/conversion-tables` is byte-identical to `/user-guide-glossary` on the reference apart from the
heading and the first section title, so it shares `pages.guideGlossary.sections` and overrides only
the first title — a faithful reproduction rather than a duplicated copy.

## 7. Category and product templates

Measured on `/en/electrical.html` and `/en/icc-durra-standard-dry-wall-panel.html`:

- **Category**: breadcrumb strip (40px) → page main → white footer; 12–15 products per grid page;
  price 18px/500 in `rgb(255,51,0)`; the department panel is `display:none` off the home page
  (our equivalent: no persistent list off `/`). Our `/categories/[slug]` +
  `/products` listing cover the same capability with backend paging.
- **Product**: breadcrumb → main (3 531px tall) → footer; gallery, price 24px/500, specs, related.
  Our `/products/[slug]` matches the capability set (B6 added the quote CTA).

These were not diffed block-by-block this pass; the notes already document the template decisions.

## 8. Classified gap list

**A — Layout — CLOSED.** `--layout-max-public: 1200px` and
`--layout-gutter-public: 0.9375rem`, applied through `shell-public`. Overlays and
`shell-workspace` keep `--layout-gutter` deliberately. The hero was re-nested inside the container
(a `padding-left` on the shell itself replaced the start gutter and overlapped the list by 15px), and
the department panel gained `w-full` so its own 1px border no longer draws 2px over the hero.

**B — Reference paths — CLOSED.** `/quotations-and-estimations`,
`/how-it-works-for-suppliers`, `/user-guide`, `/sitemap/sitemap.xml`, with 308 redirects from the
old paths.

**C — Missing editorial routes — CLOSED** for 15 routes (guide index + 7 sub-pages, `careers`,
`return-policy`, `data-deletion-instructions`, `conversion-tables`,
`privacy-policy-cookie-restriction-mode`, `how-it-works-for-buyers`, `newest-products`).
`/call-cimco` and `/special-offers` are N/A/omitted with evidence (§6.1); `/news` is closed below (D1).
The shared guide shell's contents column carries `min-w-0` so the specification tables scroll inside
their own wrapper instead of stretching the grid and the page at phone widths.

Three defects surfaced only when the transcribed pages were driven in a browser; all are fixed. The
guide's "Stockpile for Suppliers" group heading is now the link the reference publishes — it was dead
code, keyed on `entry.label` where a group carries `title`. The ICU escape `''` was rendering
literally in every collection read through `t.raw(...)`, so apostrophes came out doubled in the
transcribed prose (17 strings in `en.json`, 13 in `si.json` now carry a plain `'`; the 7 scalar keys
that *are* ICU-processed keep the escape). The two failures that were *not* product defects were the
spec's own — a third landmark inside `<main>` and a heading read that could catch the streamed skeleton
— and were fixed rather than tuned around.

**D — Home**
1. News section — ~~blocked~~ **CLOSED 2026-10-14 for the tree, still open for the home band**: `/news`
   and its post/bucket/tag pages are built from the migrated tree (§6), and the hub bar carries the
   reference's own News link again in its own order. The reference's *home* news band
   (`.blog-home5.sp-news`) is not rendered — our home keeps our own bands (deviation 6).
2. Stats band — ours only; reference has none (keeping it is a documented deviation).

**F — Visual skin — CLOSED.** Header, department panel, section headings, product cells, footer,
buttons and icons now carry the reference's measured styles (the table and the deviation list are in
§5b/§5c). A second pass took the templates we mirror with it: the page title (the reference's
`.page-title`, 24px/400 `#020202` `capitalize`), the block-title eyebrow (16px/400 UPPERCASE), the
product price (24px/500) and the breadcrumb (14px) — same §5b. The one thing that did *not* move is our
own home bands (Stats, supplier story), which have no reference counterpart to copy.

**E — Not applicable** — Magento theme demos (`/home*`, `/mbi-font-icon`), 404 fixtures
(`/no-route*`), and `/call-cimco` (§6.1); seller shops are the one tree still needing a data source we
do not have (the news tree was migrated 2026-10-14, D1).

**G — Not-found status — OPEN (app-wide, not news-specific).** Any unknown detail URL here answers HTTP
**200** with the 404 page rendered; the reference answers **404**. The cause is streaming:
`(public)/loading.tsx` flushes the shell before the page component can raise `notFound()`, so the status
is already committed. The API stays the authority and *does* refuse (it answers `RESOURCE_NOT_FOUND` — the
clean 36-spec run's traffic shows 2 × 404, both the not-found spec's unknown article slug). The fix — move the detail read
into `generateMetadata` plus a route-level guard, or trade the shared skeleton for per-route ones — would
restructure every public detail route, so it is recorded here rather than applied at the end of a content
slice.

## 9. Open decisions

None blocking A/B/C. Still open, all data-bound rather than design-bound:

1. News: revisit when api.md §2.12 lands.
2. `/special-offers`: revisit if a promotion concept is ever added to the domain.
3. Whether the audit/probe scripts and the `tests/ref-content/` captures stay in the tree as
   evidence (currently kept) or are deleted. The reference-measurement set is now
   `skin-probe` / `detail-probe` / `extra-probe` / `extra2-probe` (home) and `template-probe`
   (category + product), plus `ours-probe` and `shot-ours` on our side, all writing into
   `tests/audit/`. They are the evidence for every number in §5b, so deleting them would leave the
   table unverifiable.
4. **Icon source (§5c).** Current answer: the 22 glyphs the reference uses, rebuilt from Font Awesome
   Free 6.7.2. If the MageBig theme licence is held, the original `mbicon` webfont can be vendored
   instead; nothing else in the app would change (the names are already the reference's `mbi-*`).
5. **Font stack (§5b).** The reference declares `"Open Sans","Segoe UI","Helvetica Neue"` but ships no
   webfont, so Windows renders Segoe UI. Ours self-hosts Open Sans through `next/font`, so the face the
   theme names is the face that renders. Keeping the self-hosted Open Sans; say the word if the
   system-stack look is what is wanted instead.
