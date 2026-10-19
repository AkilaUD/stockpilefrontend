# Stockpile.lk Frontend Reconstruction — Phase 2 Notes

> **Update — Material Atlas redesign:** Visual Martfury clone is superseded. Routes, navigation IA,
> Magento path redirects, and live-API-only data rules still apply. See `DESIGN.md` and the banner
> on `PARITY.md`.

Reference-based reconstruction of https://stockpile.lk/ (Sri Lankan construction-procurement
marketplace) using **real backend data, real original assets, and real routes only**. Nothing in
this document's build is invented: every number, logo, tile and CTA traces to a live API read, an
original asset in `public/original/`, or a route that exists in this application.

## What was reconstructed this phase

### Header (reference "Martfury layout05")
- Yellow utility bar: tagline + Get Quotes / Pricing / Supplier List + EN/සිංහල switch.
- Dark masthead: yellow logo, command search ("I'm looking for…" + yellow Search chip), AccountStatus.
- "Shop By Department" (270px block on desktop, full-width below) + yellow hub bar
  (Get Quotes / How It Works / About Us / Help — *News deliberately omitted: no data source*).
- Mobile bottom dock (Menu / Search / Home / My Order / Me) on `md:` and below; Me → `/workspace`
  when signed in, else `/login` (live session read).
- DepartmentMenu: dark vertical panel under the trigger + light flyout on hover/select, data from the
  live category tree, order kept in reference order (`DEPARTMENT_ORDER`), real apps: Services/Training
  appended because they exist in the backend tree.

### Home page (reference section order)
1. Hero banner — original asset (`public/original/hero-how-it-works.jpg`, 871×366), whole banner →
   `/how-it-works` with a dark CTA chip overlay.
2. Stats band (dark) — **honest live counts**: Products / Suppliers / Departments / Categories
   (`/api/v1/catalog/summary` + tree). The reference's RFQ & call counters have no endpoint here.
3. Most Searched — six original tile graphics → real deep category routes.
4. Featured Products — newest-first sweep, page 1 (the API has no `featured` flag; slice is honest).
5. Newest Suppliers — directory registration order via `SupplierStoryStrip` (logo grid when the
   directory returns seeded `logo` srcsets; text register otherwise).
6. Become a Supplier band (signal yellow) → `/supplier-benefits` + `/pricing`.
7. Newest Products — newest sweep, page 2 (real "more recent" list).

### Editorial pages (9, shared `InfoPage` shell + breadcrumbs)
`/quotations` `/how-it-works` `/supplier-benefits` `/pricing` `/about-us` `/contact` `/help`
`/terms-of-use` `/sitemap` — copy faithful to the captured original text, in both locales,
all CTAs verified to resolve to real routes (see dependencies for the intentional substitutions).

### Key wiring fixes
- **Category URLs**: backend slugs are full paths (`flooring/floor-carpets`, `plumbing/…/…`), the
  category route is one dynamic segment. All generated links percent-encode the slug via
  `categoryHref()` (`navigation.ts`) so deep category navigation actually resolves (previously the
  department flyout, home tiles, search suggestions and breadcrumbs 404'd on the catch-all).
- Mobile drawer accordion (native `<details>`), Esc closes, nav closes the drawer.
- Distinct a11y labels: desktop hub "Main navigation", mobile dock "Mobile quick navigation".
- Home `<title>` no longer double-appends the brand via the `%s · Stockpile.lk` template.

## Phase-2 audit and repair (2026-10-13)

Full-stack audit of every route vs the live backend, root-caused and fixed, verified end-to-end.
Defect inventory B1–B19 (the honest list of what was actually broken):

| # | Defect (root cause) | Fix |
|---|---|---|
| B1 | Register success landed on `/login` instead of the documented post-register surface | `register-form.tsx` now `router.replace("/verify-email?email=…")`; e2e expects it |
| B2 | e2e smoke/responsive specs were stale (filled First/Last/Phone; asserted a suffix on the account name the 2-field backend never produced) | specs updated to the real 2-field register; account name = email local part |
| B3 | Rate budgets are small and shared — repeated runs burned the register quota and made e2e flaky | one consolidated Playwright run; budgets re-checked against `RateLimitPolicies.cs` |
| B4 | `/workspace` was a bare EmptyState; real authenticated surfaces existed in the API but nothing consumed them | `WorkspaceAccount` (profile, roles, verification pill, resend CTA), `WorkspaceSecurity` (change password, session directory, per-device revoke, sign-out-everywhere), `RoleGate` for the role-scoped groups |
| B5 | Search API results hardcoded `pageSize: 24` | `catalogue-server.ts` sends the `CATALOGUE_PAGE_SIZE` constant; listing page derives totals + pagination from it |
| B6 | Product page had no quote CTA | `ButtonLink` "Request a quote" → `/quotations` + hint |
| B7 | `/admin` and `/supplier` admitted any signed-in user | gated on `platformAdministrator` / `supplierOwner\|supplierUser` (UX layer; the API stays the authorization authority) |
| B8 | Address book — documented Phase-2 UI; needs seeded district/province reference data with no exposing endpoint | NOT built (correctly deferred, no invented surface) |
| B9 | e2e webServer booted the frontend with `next start`, but the build is `output: standalone` — Next explicitly does not support `next start` for standalone builds (boot warning + in-flight RSC streams can be aborted: every request in the first e2e run logged "The destination stream closed early") | `scripts/standalone-serve.mjs` stages `.next/static` into the standalone tree and boots the deployment artifact (`node .next/standalone/server.js`); `playwright.config.ts` webServer now runs `npm run start:standalone` with `API_ORIGIN` injected (standalone server.js does not load .env files) |
| B10 | **The smoke-home failure's real root cause: the home page rendered no `<h1>` at all (EN or SI).** The 1.55 gate's `expect(h1).not.toBeEmpty()` failed with "element(s) not found" on a fully-rendered page — `h1-count=0` proven in both locales. The stream-abort logs, LocalDB SqlExceptions and "silent API windows" were all noise around this; the page data was always fine | `home.hero.headline` added to `messages/{en,si}.json` (`"Build the list. Buy smarter."` / its Sinhala translation — the reference tagline); `HeroBanner` renders it as the page's single visually-hidden `h1`. Restores the reference headline + fixes a genuine a11y gap (most-important page had no level-1 heading) |
| B11 | Home page held the entire body behind one `Promise.all` of five catalogue reads with no Suspense and no error boundary — a slow or failed read blanked everything below the header; the layout additionally awaited the category tree before streaming the shell | Home sections now stream independently: hero/static bands first, each data section in its own Suspense with a skeleton fallback; the mobile dock's tree fetch moved inside a Suspense boundary so the shell never waits on catalogue data. `catalogue-server.serverGet` bounds every SSR read with `AbortSignal.timeout` (10s) + one fresh-connection retry (a half-dead pooled keep-alive socket can otherwise stall a render past undici's 300s default) |
| B12 | `ArchitectureTests` X6/S10 gate failed: `CatalogueSeeder` assigned `Status = SupplierStatus.Active` and `Status = ProductStatus.Published` directly — a §7 bypass per the domain rule (first run of the deferred suite surfaced it) | Supplier line removed (the entity's declared default is already `Active`, behavior-identical); product landing state now resolved once through `StateMachine<Product>.Evaluate(PendingReview → Published, product.moderate, System)` with a loud boot failure if the machine ever rejects it — architecture suite back to 12/12 |
| B13 | **Responsive flake root cause: `ProductGridSection`'s header CTA.** Home sections stream independently (B11), so the SI "equivalent →" CTA (`whitespace-nowrap` in a non-wrapping `flex justify-between`) only overflowed (18px @ 360px) when the Newest Products section had streamed in before the responsive spec's `document.fonts.ready` measurement — a coin-flip timing gate, layout genuinely too wide in SI | Header row now `flex flex-wrap items-end justify-between gap-x-4 gap-y-2` — a long localized CTA drops to its own line instead of overflowing; measurement is deterministic in any stream order. Audit of all `whitespace-nowrap` uses: the other three (flyout row item, button, status pill) are single-row layouts with no squeeze and passed every route |
| B14 | **A failed SSR catalogue read white-screened the route.** `SiteHeader` awaited `getCategoryTree()` unguarded *outside* any Suspense/error boundary, so the header read gated the entire layout; the home section reads threw to the route error boundary. Under the e2e's navigation burst the public-read limiter answered **429** (see limitation row below), the read threw, and Next rendered its global "This page couldn't load" — losing `#main-content`, the hero and the `h1` (the `#main-content not attached` failure) | Every catalogue read that renders shell chrome is now contained: `SiteHeader` falls back to an **empty tree** (masthead renders without departments), the dock tree and each home section catch and **omit only themselves** (a `safeRead` helper logs the failure server-side), so a 429/5xx blanks at most one section — never the shell. `ProductGridSection`'s "View All" CTA also wraps (B13) |
| B15 | The reference masthead's `ul.header.links` (Supplier Login · Supplier Registration · Request For Quote) had no equivalent here, the hub's "Get Quotes" pointed at the `/quotations` editorial page rather than a request-quote surface, and two site CTAs **labelled** "Register As A Supplier" (`/supplier-benefits`, `/pricing`) dropped the visitor on the **buyer** `/register` form | `SUPPLIER_LINKS` added to `navigation.ts`: rendered in the masthead at `xl` (`hidden xl:flex`, so the search box + account island keep their room at 768/1024), carried by the drawer below `xl`; hub `getQuotes → /rfq` (utility "Get Quotes" stays `/quotations`, matching the reference split); the supplier CTAs now target `/supplier-register`, and `LoginForm` gained a `registerHref` prop so the supplier sign-in page offers supplier (not buyer) registration |
| B16 | The destinations behind those links did not exist: neither `/supplier-login`, `/supplier-register` nor `/rfq` was a route, and the API had no supplier-registration or RFQ surface | Built for real (see "Built behind the header links" below): supplier registration end-to-end, and the org-owned RFQ subsystem (create → submit → match → dispatch) with its own persistence, validators, matching and tests |
| B17 | **The "Shop By Department" list was never a list on the home page.** The reference opens `.vertical-menu .navigation` permanently from 1200px on the home page only (`.layout05.cms-index-index`), and the home banner row reserves an empty 300px `col-md-3` (`hidden` below `md`) beside a 75%-wide `col-xl-9` hero for it to fill; here the block was a hover/click popover at every width, so the home page showed no department list at all and the hero stayed full width. The block itself was also `w-full` under `lg` — at 768–1023px it stretched across the whole menu row (~668px @ 768) instead of keeping the reference's `col-md-3` column | `DepartmentMenu` now has two behaviours, both measured off the live site (2026-10-14): at `min-[1200px]` **on `/` and while the header is at the top of the page** it renders the list permanently (the reference collapses it the moment the header sticks — `.sticky-menu.active … { display:none }` — which is also what keeps it from following our always-sticky masthead down the page); everywhere else it keeps the Radix popover contract. `HeroBanner` reserves the same 300px column (`min-[1200px]:pl-[300px]`, `sizes` updated), so the list fills a real gutter instead of covering the banner. The block and the panel column are now the reference's widths — a single `@utility department-block` (100% → 768px:270px → 1200px:300px) rather than `w-full` under `lg`. The utility exists because the obvious `w-full md:w-[270px] min-[1200px]:w-[300px]` ladder **silently loses**: Tailwind emits the arbitrary `@media (min-width:1200px)` block *before* the named `md:` (`@media (min-width:48rem)`) block, so `md:w-[270px]` wins at every width ≥768 — the block was measured 270px beside a 300px panel, a 30px notch between the heading and the list it heads. New spec `tests/e2e/home-departments.spec.ts` pins all three (open with no interaction, never overlapping the hero, collapsing on scroll) **and** the 300px alignment of the block with the panel |
| B18 | **A client that hung up mid-request was logged as a server fault.** `ApiExceptionHandler` classified the abort as 499 only when the surfaced exception was an `OperationCanceledException`; when the connection closed while a database command was in flight the data layer raises its provider's own cancellation instead — `SqlException: Operation cancelled by user` — so the request fell through to the generic branch and answered **500 INTERNAL_ERROR with a full stack trace** (and the envelope write then threw again, because it wrote with the request's own cancelled token). One e2e run that navigated away from in-flight reads logged **8 of these as `ERR … 500`** (`/auth/session`, `/auth/sessions`, `/auth/antiforgery`) | The abort is now read from the **request state** (`httpContext.RequestAborted.IsCancellationRequested`) rather than the exception type, so every shape of a client hang-up answers 499 and nothing is logged at Error; an `OperationCanceledException` that arrives with the request still live (a server-side timeout) deliberately still becomes a 500. Integration seam `_test/abandoned` reproduces the exact event (aborted request + provider-shaped throw) and `ErrorEnvelopeApiTests.A_client_hang_up_answers_499_instead_of_an_internal_error` pins it |

| B19 | **The "Shop By Department" submenu could not be clicked — it vanished the moment the pointer reached it.** Reported from the running app: "shop by department menu. when go to sub menu, cant click, it exit". Two independent causes. (1) The flyout is a flex *sibling* of the department column, and the column cleared the active department on `mouseleave` — an event that fires as the pointer crosses from a row into that sibling — so the flyout unmounted mid-move (measured: `flyoutCount` 1 → **0**, and `elementFromPoint` at the flyout's centre returned `SECTION.shell-public`, the page underneath). Every submenu link was therefore unreachable on every route. (2) In the permanent home-page behaviour the panel wrapper was `overflow-hidden` at exactly the 300px column, and the flyout is a second 270px column offset 300px — so on `/` the submenu was clipped away entirely (flyout rect began at `x=355` against a clip box ending at `right=355`) and never painted at all. Nothing covered it: `home-departments.spec.ts` pinned the disclosure, not the flyout inside it | Reference re-measured on the live site (2026-10-15, `Crawl-delay: 10` respected): `.vertical-menu` computes `overflow: visible`; `.submenu` is `position:absolute; left:100%; top:0; z-index:999`; and the disclosure is `.magebig-nav li.level0:hover > .show-sub` — a *descendant* of the row's `li`, so a row and its flyout are one hover region, and the absolutely positioned `.submenu` (measured 270×629) can never resize `.navigation` (measured 300×414, its own rows). The fix makes our sibling column behave the same way: the list's `mouseleave` now clears the active department **only when the pointer actually leaves the panel** (`relatedTarget` still inside the panel is ignored — the flyout cannot literally be nested in the list, because the list is the column that scrolls); `overflow-hidden` dropped so the flyout floats out over the banner; the column gained `self-start` + its own `max-h` so it keeps its own height (486) instead of stretching to the flyout beside it (700), and still scrolls when its own list outgrows the viewport; and dismissing the popover (Esc, outside click) now drops the active department, so the flyout is no longer already open the next time the panel appears. New test `tests/e2e/home-departments.spec.ts` — "a department flyout survives the move into it, in both behaviours" |

### The critical operational finding: `API_ORIGIN` staleness

The frontend renders from **server-side direct fetches** (which read `process.env.API_ORIGIN` per request), but the
**browser-side `/api/v1/*` calls go through the next.config.ts `rewrites()`**, whose destination is computed **once at
dev-server startup**. Symptoms that all traced back to this:

1. The backend was running under **IIS Express** (`http://localhost:8864` / `https://localhost:44327`) while
   `frontend/.env.local` still pointed at Kestrel `:5080` — pages rendered (SSR direct fetch) but every browser-side
   auth call 401/500'd and `/auth/antiforgery`, `/auth/session` and the login POST failed with next-dev
   "Failed to proxy http://localhost:5080 … AggregateError".
2. Editing `.env.local` does **not** hot-reload a running `next dev` (Next 16.3.8 + Turbopack) — the rewrite target
   stayed stale until a full restart.

Resolution: run the API the canonical way (`dotnet run` from `backend/src/Stockpile.Api` → Kestrel `http` profile on
`:5080`), point `API_ORIGIN=http://localhost:5080`, and **restart `next dev`** after any origin change. Once aligned,
the proxied chain is verified: catalogue 200s with live data and `Set-Cookie` (antiforgery/auth/refresh) relays through
the rewrite first-party.

### Ballot-box verification of the repaired flows (live backend, real identity)

- Register → `/verify-email?email=…` with the exact email echoed + "Check your inbox".
- Login → ticket set, header flips to the account name (email local part), post-login redirect to `/`.
- Account menu → "My workspace" → `/workspace`: "No activity yet" EmptyState, Account card (email, `Buyer` role,
  confirmed pill), Security card (Change password, Active sessions with "This device" marker).
- Change password → success panel "Every other session was signed out"; old password now rejected with the
  INVALID_CREDENTIALS banner; new password signs in.
- Role gates: a buyer at `/admin` and `/supplier` sees "You do not have access to this area".
- Sign out on all devices → full reload to the signed-out public home.
- 360 px viewport on `/workspace`: no horizontal overflow. Console: only the expected anonymous `401 /auth/session`.
- Backend suite (final): `Stockpile.UnitTests` 45/45, `Stockpile.SecurityTests` 2/2,
  `Stockpile.ArchitectureTests` 12/12, `Stockpile.IntegrationTests` 162/162 — **221/221**, run with the
  API stopped (DLL lock), then the API restarted on `:5080`.

### Root cause of the recurring smoke-home failure (corrected record)

Two full e2e runs and the seed data all passed except `smoke.spec.ts:27` ("home renders on the HTTP stack, EN and
SI") — the `h1` assertion failed with "element(s) not found". The forensic trail pointed at the API log (a
`SqlException: A severe error occurred on the current command` on `/catalog/media` in run 1; `Operation cancelled
by user` + 499s on auth endpoints in run 2) and at "The destination stream closed early" abort noise from the
standalone server. The true cause, proven by a DOM probe (`h1-count=0` on both `/` and `/si`): **the home page had
no `<h1>` at all.** The hero was a whole-banner `<Link>` to `/how-it-works` carrying the graphic; the reference
headline was never restored as a heading, so the phase-gate assertion correctly failed on a page that otherwise
rendered completely and fast. The DB/stream events were incidental noise (real but unrelated: one transient
LocalDB hiccup, plus prefetch aborts from the suite's own rapid width-navigation). Fix B10 restores the reference
tagline as the localized sr-only `h1`; B11 hardens the home page and the SSR transport while here.

### Design clarification (not a defect): email confirmation on register

`Stockpile.Application/AuthenticationService.RegisterAsync` sets `EmailConfirmedAt = now` — self-service registration
**immediately confirms the email** ("email ownership is not verified during registration"). Consequences, all consistent
with the backend's A11 gate (threat-model line 169: verification gates RFQ submit, not sign-in):

- A fresh signup is session-reported `emailConfirmed: true` → the account card shows "Email confirmed", no resend CTA.
- The verify/resend endpoints answer `AlreadyVerified` for such accounts; clicking an old confirmation link resolves to
  "already verified" rather than failing.
- The unverified pill + resend CTA still render for genuinely unconfirmed accounts (e.g., provisioned outside the
  self-serve path).

## Built behind the header links (2026-10-13/14)

The reference's `ul.header.links` is a five-link group (verified against https://stockpile.lk/ on 2026-10-13).
Log In / Register stay the `AccountStatus` island's job; the other three — **Supplier Login · Supplier
Registration · Request For Quote** — are `SUPPLIER_LINKS`. None of their destinations existed, so all three were
**built against the real API** rather than pointed at a placeholder (B16). Each one, and what it actually does:

- **Supplier registration** — new `POST /api/v1/auth/register/supplier` + `/supplier-register` (under `(auth)`).
  Reuses the existing tables (no migration) and the same identity system. One atomic submit; the supplier lands
  `SupplierStatus.Active` + `VerificationState.Unverified`, with categories submitted as slugs. Registration also
  creates the supplier's own organization, so the resulting session carries one org membership. The submit stays a
  single atomic call, but the form is now **resumable** (residual #4a, 2026-10-14): the non-secret prefill autosaves
  to a server-side registration draft behind an opaque `draftToken`, and that token rides the register call.
- **Supplier sign-in** — `/supplier-login` reuses `LoginForm` against the same `POST /auth/login` (one identity
  system, business-flows §3.1); only the frame copy and the register target differ (B15).
- **RFQ** — the org-owned flow of api.md §2.6, built end to end:
  - `POST /rfqs` creates the Draft with its items inline; `POST /rfqs/{id}/submit` runs matching and dispatches;
    `GET /me/rfqs` lists the caller's own; `GET /rfqs/{id}` is ownership-checked (a foreign id answers **404**,
    not 403 — no BOLA oracle).
  - There is no org-creation UI, so a caller with no accepted buyer membership provisions the company in the
    same call via the optional `company` block (`OrganizationService.CreateOrganizationAsync`); a missing company
    is a 422 `company`/`required` field error.
  - Matching: each item's `categorySlug` resolves to an active `Category`, expands to its ancestors, and overlaps
    active quotable suppliers via `SupplierCategory`; one `RFQMatch` per supplier, scored by overlapping-category
    count, capped at 50.
  - State: Draft → Submitted (`rfq.submit`, user) → Matching → Dispatched (`rfq.match`, system), every allowed
    edge appending `RfqStatusHistory`. The A11 email gate is enforced first in `SubmitAsync`
    (`EnsureEmailVerifiedAsync`) — safe because registration sets `EmailConfirmedAt`.
  - Persistence: migration `20261013175104_RfqProcurement` (`RFQs`/`RFQItems`/`RFQMatches`/`RFQStatusHistory`),
    applied to `Stockpile_Dev`. `RfqApiTests` covers the flow; the shared-`Stockpile_Test` isolation bugs it
    surfaced are fixed by scoping assertions to the test's own id/org.
  - Front end: `/rfq` decides sign-in prompt vs. fields from the live session, reads departments + units
    server-side (B14-contained), submits the two real calls, and shows the server's reference code + match count;
    `RecentRequests` reads the real `GET /me/rfqs`. `/quotations`' primary CTA is now a real `Link` to `/rfq`
    (mailto kept as the alternative).
- **Capability pre-emption** — a supplier account can sign in at `/rfq` but holds no `rfq.create`. The form used
  to render and then 403 on submit; it now reads the session's own capability set and shows a buyer-action notice
  with a route to buyer registration, while the API's 403 remains the authority's backstop.

## Verification — phase-2 audit run (2026-10-13)
- `npx tsc --noEmit` — clean; `npx eslint .` — clean; `npx next build` — **passes**, 26 routes,
  46 static-pages, standalone artifact (`.next/standalone`) staged + booted for e2e.
- **Playwright e2e (final artefact, real backend on :5080): 9/9 passed, 0 × 429** — responsive (public + signed-in
  workspace at all seven gate widths, no overflow), security headers (CSP Report-Only + fresh nonce + static
  headers; CSP violation sink), smoke (home EN+SI renders with the restored localized `h1`, login failure
  banner, register→sign-in→sign-out flip, reset-password dead/bad-token paths). The previously-failing
  smoke-home test passes because B10 restored the heading the page always lacked; B11 removed its data
  dependency and the layout shell gate; B13 fixed the SI section-header overflow; B14 makes a failed/rate-limited
  SSR read omit a section instead of the page.
- Backend: `Stockpile.UnitTests` 45/45, `SecurityTests` 2/2, `ArchitectureTests` 12/12, `IntegrationTests`
  162/162 — **221/221** (run with the API stopped, then restarted on `:5080`).
- Browser QA (all against the real backend on :5080): hero→stats→tiles→featured→suppliers→band→
  newest; no console errors other than the preexisting auth `/session` 401 (below).
- Breakpoints 1440 / 1280 / 1024 / 768 / 390 / 360: **no horizontal overflow**; hub hidden and dock
  shown below `md`; drawers open/expand/close; Sinhala locale renders all sections and pages.
- Deep navigation proven end-to-end: home tile → `…%2Fsteel-items%2Fbox-bars-square-tubes` → "Box Bars";
  dept-menu flyout child → `…%2Fsteel-items` → "Steel Items"; breadcrumb + pagination on those pages.

## Verification — feature build: header links, supplier registration, RFQ (2026-10-14, final)
- `npx tsc --noEmit` — clean; `npx eslint` on every changed file — clean; `npx next build` — **passes**, 30 routes
  (now including `/rfq`, `/supplier-register`, `/supplier-login`), standalone artifact staged + booted for e2e.
  Build-time `DYNAMIC_SERVER_USAGE` lines from B14's contained reads are expected (see B11/B14).
- **Playwright e2e (real backend on :5080): 13/13 passed** — responsive 2 (public + signed-in workspace, all seven
  gate widths), **rfq 4** (masthead header links exist *and* resolve to the real routes; every supplier CTA lands
  on `/supplier-register` not buyer signup; signed-out `/rfq` prompts sign-in; full register → sign-in → submit →
  list-back round trip), security-headers 2, smoke 5.
- Backend: `Stockpile.UnitTests` 45/45, `SecurityTests` 2/2, `ArchitectureTests` 12/12, `IntegrationTests`
  171/171 — **230/230** (run with the API stopped to release the DLL lock, then restarted on `:5080`).
- API log for the final run (747 requests): 599 × 200, 4 × 201, 1 × 204, 100 × 401 (the anonymous
  `/auth/session` probe, expected), **34 × 429 on `/api/v1/catalog/categories`** (the shared SSR-read partition —
  see the limitation below — all contained by B14, no white screen), 8 × 499 (client prefetch aborts),
  1 × 400 (`INVALID_RESET_TOKEN`, expected), 1 × 401 (`INVALID_CREDENTIALS`, expected). **No 500s.** The 429 count
  moves with burst timing (0 in the quiet 2026-10-13 artefact run, tens under the suite's navigation burst); it is
  containment, not a defect, that keeps the gate green either way.
- Real round trips exercised in-session: supplier registration → `201` → `/verify-email`; supplier sign-in →
  `200` → header account menu; buyer register `201` + login `200`; RFQ → `POST /rfqs` 201, `POST /rfqs/{id}/submit`
  200, `GET /me/rfqs` 200 (success panel showed the server reference + "1 supplier matched", and the "Your
  requests" list echoed title/reference/Dispatched/match count).
- Browser QA: `/quotations` CTA is the real `/rfq` link; **no horizontal overflow** on `/quotations`, `/rfq`,
  `/supplier-register`, `/supplier-login`; console clean apart from the known anonymous-session 401 and
  report-only CSP notes.

## Verification — department list persistence (B17) and abort classification (B18) (2026-10-14)
- **Playwright e2e (real backend on :5080): 17/17 passed** (1.4m) — `home-departments` 4 (permanently open from
  1200px with no interaction; collapses once the header sticks; still a disclosure everywhere else; the block keeps
  the reference column from 768px), `responsive` 2, `rfq` 4, `security-headers` 2, `smoke` 5.
- Geometry re-measured at **1200 / 1280 / 1440 / 1600** over the built standalone and hit-tested rather than
  eyeballed: the block is **300×48 @ x=0**, the panel list **300 wide @ x=1** (that 1px is the panel's own border),
  the hero starts at **x=300** (gap 0), `document.scrollWidth === innerWidth` at every width, and
  `document.elementFromPoint(hero.x + 8, hero.y + 12)` returns the **hero image**, not the panel — the list fills
  the reserved gutter instead of covering the banner. 12 rows, first "Building Materials", panel background
  `rgb(2,2,2)` (the reference's masthead black). At 768 the block is still the 270px `col-md-3` column with no
  panel, and on `/pricing` at 1280 it is the disclosure button again.
- `@utility department-block` verified in the built bundle:
  `.department-block{width:100%}@media (min-width:768px){.department-block{width:270px}}@media (min-width:1200px){.department-block{width:300px}}`
  — and it sits **before** `.w-full{width:100%}`, which is why the SSR fallback button no longer carries `w-full`
  (a custom and a core `width` utility on the same element resolve by source order).
- `npx next build` passes (30 routes); standalone staged and booted on `:3000` against the real API on `:5080`.
- Backend: `Stockpile.UnitTests` 45, `SecurityTests` 2, `ArchitectureTests` 12, `IntegrationTests` **172** (the new
  abort seam test included) — **231/231**, with the API stopped to release the DLL lock, then restarted.
- API log for the 17-test run (`backend/api-run12.log`, 912 lines): **910 INF, 0 ERR, 0 × 500, 0 SqlException**;
  38 × 499 (client hang-ups, now classified as such) and 40 × 429 (the shared anonymous-read partition — containment,
  see the limitation below). The same suite before the B18 fix logged **8 × `ERR … 500`**, each with
  `Microsoft.Data.SqlClient.SqlException (0x80131904): Operation cancelled by user` raised from
  `AuthenticationConfiguration.ValidateSessionAsync` (the session probe cancelled mid-query when Playwright navigated
  away) and then "an exception was thrown attempting to execute the error handler" — the handler was writing its
  envelope with the already-cancelled request token.
- Screenshots kept as evidence: `tests/artifacts/home-1280-department-list.png`,
  `tests/artifacts/home-768-department-button.png`, `tests/artifacts/pricing-1280-no-panel.png`.
- e2e note: the RFQ round trip no longer treats a rate-limited select as fatal. Both the unit and the department
  option lists come from uncached reads on the shared anonymous budget, so the test probes for a real option with a
  bounded 5s wait and submits with the placeholder when the read lost the race (both fields are optional on the
  wire). Before that change `selectOption({index: 1})` waited for an option that was never coming, which is how a
  429 surfaced as a 120s test timeout instead of a clear failure.

## Verification — department flyout reachability (B19) (2026-10-15)
- Reproduced in the built app before touching code: hovering "Building Materials" opened the flyout, and a 25-step
  pointer walk toward it unmounted it (`flyoutCount` 1 → **0**), with `elementFromPoint` at the flyout's centre landing
  on the page underneath. On `/` at 1280 the flyout was additionally clipped — its rect started at `x=355` while the
  clipping wrapper ended at `right=355`.
- Re-measured the same way after the fix, in **both** behaviours: flyout present (`1`), hit test inside the panel's own
  flyout wrapper, and a **real `click()` on the "Paint" link navigates to `/categories/building-materials%2Fpaint`** —
  on `/` (permanent column, flyout at `x=355 w=270`) and on `/pricing` (popover, flyout at `x=356 w=270`).
- Geometry after the fix (home @1280): column **300×486** (its own rows), flyout **270×700** — the flex row gives the
  flyout the row's height, mirroring the reference's `min-height: 100%`; the panel box is 700 and paints nothing.
- The new test was proven to bite, not just to pass: with the two defects temporarily restored and the app rebuilt,
  `npx playwright test home-departments -g "department flyout survives"` fails at the pointer-walk assertion
  (`expect(flyout).toBeVisible()` → "element(s) not found", evidence `tests/home-departments-neg.log`); with the fix it
  passes. The screenshot/attachment Playwright captured on that failing run shows the flyout gone.
- Gates: `npx tsc --noEmit` and `npx eslint src --max-warnings=0` clean (`frontend/tsc-deptmenu.log`,
  `frontend/eslint-deptmenu.log`); `npm run build` (Turbopack, the default) exit 0 (`frontend/build-deptmenu3.log`);
  `home-departments.spec.ts` **5/5** (`tests/home-departments-2.log`); whole Playwright suite **44/44** in 4.1m, exit 0
  (`tests/dept-menu-full-1.log`) — up from 43, the flyout test being the new one. The API was restarted first so the
  suite's five `auth.register` calls had a fresh budget. No backend file was touched, so the backend gate stands at
  **256/256**.
- API/server traffic during the suite: **0 × 5xx**. The `429`s in the log are the documented anonymous-read partition
  and the `[home] catalogue read failed; omitting section` / `[site-header] … rendering header without departments`
  lines are B14 containment doing its job — a rate-limited read omits one section or the department list, never the
  shell. The `destination stream closed early` lines are the documented client-navigation aborts (B9/B18).

## Reference-parity pass: container frame (A), reference paths (B), editorial transcriptions (C) (2026-10-14)

The `frontend/PARITY.md` audit classified the distance to the live site into gaps A–E. This pass closed
A, B and C.

### A — the reference content frame (1200px / 15px gutters)

Two new tokens, applied only by the public shell:

```css
--layout-max-public: 1200px;
--layout-gutter-public: 0.9375rem; /* 15px */
```

- `@utility shell-public` now reads those, so every public page moved from our 1440px frame to the
  reference's measured one. `shell-workspace` and the overlay shells keep `--layout-gutter`
  (24→48px): they were never part of the reference's public frame and their own geometry was
  measured separately.
- **B17 follow-through.** The department block is a child of the header's `shell-public` row, so it
  moved with the frame: at a 1280px viewport the block starts at x=55
  (`(1280 − 1200)/2 + 15`) instead of x=0.
- **The hero had to be re-nested to match.** `hero-banner.tsx` was
  `shell-public min-[1200px]:pl-[300px]`; that puts the image at `40 + 300 = 340` while the
  department list ends at `55 + 300 = 355` — a 15px overlap caused by `padding-left` replacing
  `padding-inline`'s start edge and dropping the gutter. It is now `shell-public > div.pl-[300px]`,
  a second offset *inside* the container, so the image starts exactly where the list ends (x=355)
  and the width matches the `sizes` hint (`calc(min(100vw, 1200px) - 330px)` = 870px).
- `tests/e2e/home-departments.spec.ts` pins both edges (`contentLeft()` helper) so the frame, the
  column and the hero cannot drift apart again.

### B — the reference's own paths

The reference path is now canonical and the old path is a `308` (permanent, query-preserving)
redirect declared in `next.config.ts` `redirects()`. That hook runs **before** the next-intl proxy,
so it is safe with `localePrefix: "as-needed"` and works for both `/x` and `/si/x`.

| Ours (old) | Reference path (new) |
|---|---|
| `/quotations` | `/quotations-and-estimations` |
| `/supplier-benefits` | `/how-it-works-for-suppliers` |
| `/help` (kept as our FAQ) | `/user-guide` is now its own transcribed page |
| `/sitemap` (kept as the HTML sitemap) | `/sitemap/sitemap.xml` is now a real XML route |

`/sitemap/sitemap.xml` is a route handler outside the `[locale]` tree, so it is registered in
`proxy.ts`'s `APP_ROUTED_URLS` to keep the locale proxy from rewriting it, and the footer renders
that one link as a plain `<a>` rather than a locale-aware `<Link>`.

### C — the editorial pages, in the reference's own words

19 reference editorial routes were captured before writing anything (`tests/ref-content/`, EN + SI,
HTML + text). 15 pages were then built from that copy; `/terms-of-use` + `/how-it-works` already
existed.

- Shared chrome: `src/components/pages/user-guide-shell.tsx` (breadcrumb, left contents column,
  Prev/Next topic derived from nav order, `aria-current`) and
  `src/components/pages/prose-sections.tsx` (the section shape: title / body / bullets /
  definitions / footer / link).
- Copy lives in `pages.<key>` in `en.json`, so it goes through the same i18n gate as everything
  else. The one genuinely tabular page (`/user-guide-product-specifications`, 28 tables, 376 rows)
  keeps its data in `src/lib/content/product-specifications.json`, generated by
  `tests/gen-spec-data.mjs` from `tests/ref-content/spec-tables.json` and recording its source URL
  and capture date.
- **Both locales serve the reference's English editorial copy.** That is a measurement, not a
  shortcut: the captured `/si/*` pages are character-for-character identical to their `/en/` twins
  for all 19 routes. The two exceptions the reference does localize are
  `/si/quotations-and-estimations` and `/si/newest-products` (Sinhala titles), and ours are
  localized there too. Nothing was machine-invented: Sinhala legal/commercial wording that the
  reference does not publish is not in this build. en/si key parity is still enforced (555 keys
  each, 0 one-sided) by copying the new English-only keys into `si.json` verbatim.
- Reference typos are preserved on purpose ("Fiters", "specifciations", "arragements", "withold",
  "verifciation"); the only normalisation is the H1's "productat" → "product at", which is a
  source line-wrap artefact.
- `/conversion-tables` is byte-identical to `/user-guide-glossary` on the reference apart from the
  heading and the first section title, so it shares `pages.guideGlossary.sections` and overrides
  just that title instead of duplicating the copy.
- `/newest-products` is a real listing on the reference too, so it renders **our** catalogue
  (`getProductListing({ sort: "newest" })`) with the reference's heading copy — the honest
  equivalent of their newest-first grid.
- Guide entries the reference lists but never links ("Buyer Registration", "Updating Buyer
  Profile") render as muted text, not fake links. Its "Stockpile for Suppliers" group heading *is* a
  link in the reference (to `/user-guide-supplier-registration`) and is one here too — see
  "Content and landmark defects the editorial spec caught" below.
- The reference's group headings on `/user-guide-glossary` and `/conversion-tables` are rendered
  uppercase by `text-transform`: on the live page `innerText` reads "SCREWS" while `textContent` reads
  `screws` (measured 2026-10-14, computed `text-transform: uppercase`). We store the rendered text. The
  heading *level* differs deliberately — the reference emits these as H3 under its H1, skipping a level;
  we render H2.
- The three video guide pages render the reference's own "This video shows…" text; no video asset
  exists, and the docblock says so rather than the UI.

Not reconstructed, with evidence:

- **`/special-offers`** — no discount / special-price / compare-at-price concept exists in the
  backend (`grep 'SpecialPrice|CompareAtPrice|Discount' backend/**/*.cs` → no matches), so there is
  nothing to render. Same class of decision as the "OUR PARTNERED BUYERS" strip.
- **`/call-cimco`** — captured and inspected (`tests/ref-call-cimco.mjs`): the reference page is an
  unwired stub (`#askhotline` "Click to Call" with an empty `onmouseover=""`, no `tel:` href, no
  number). Classified N/A.
- **`/news`** (+4 categories, ~57 posts) — still blocked: no data source (api.md §2.12 is a later
  phase).

`/contact`'s "Stockpile Careers" block now points at our own `/careers` (the reference's route)
instead of the company LinkedIn profile, because that page exists as of this pass.

### Layout defects the browser gate caught (all fixed)

The responsive and geometry specs failed on real geometry, not on cosmetics, once they ran against
the production build at every target width. Three separate causes:

1. **The hero overlap came from the panel's border, not the offset.** The persistent department
   panel shrink-fits to its own `w-[300px]` list *plus* its 1px border, so it measured 302px and drew
   2px over the hero whose left edge is at `x=355`. The panel now carries `w-full`: its border box is
   exactly the reserved column, and the block's right edge and the hero's left edge are the same 355.
   The spec asserts that equality directly instead of tolerating a pixel.
2. **A Sinhala verification label overflowed the document at 768px.** `home.newestSuppliers.unverified`
   ("සත්‍යාපනය බලාපොරොත්තුවෙන්") contains a word ~134px wide that cannot fit the 2/12 status cell
   (~94px) of the home supplier roster, so the word pushed the page's `scrollWidth` to 777 at a 768px
   viewport. The status cell now carries `min-w-0 break-words`, so a label that does not fit wraps
   inside its cell. (The English label is short and unaffected.)
3. **The guide shell's contents column stretched the grid at phone widths.** The specification page's
   tables have a 36rem min-width; a grid item's automatic minimum is its content's min-content, so the
   whole `lg:grid-cols-[16rem_1fr]` grid computed to 576px and scrolled the page sideways at 360px.
   The content column is now `min-w-0`, so the tables scroll inside their own `overflow-x-auto`
   wrapper (measured: 330px column, 576px table, document `scrollWidth` == viewport).

### Content and landmark defects the editorial spec caught (all fixed)

1. **The "Stockpile for Suppliers" group heading was not a link.** The reference links it to
   `/user-guide-supplier-registration` (capture: `tests/ref-content/en-user-guide.json` → `links`), and
   our nav data carried the `href`, but the shell's group branch keyed its `<Link>` on `entry.label`
   while a group heading carries `title` — so the branch was dead code and the heading rendered as inert
   text. The link text now falls back to `entry.title`. `linkedTopics` (which drives Prev/Next) still
   ignores group headings, so the destination the heading shares with its first child does not appear
   twice in the pager.
2. **Apostrophes rendered as `''` in every transcribed section.** `t.raw("sections")` returns the
   message value **without** ICU processing, so the ICU escape `''` — correct for the scalar keys read
   with `t("key")` — was emitted literally ("the grinding wheel''s surface"). 17 strings in `en.json` and
   13 in `si.json` were affected; each was confirmed against the rendered HTML before being changed, and
   the 7 scalar keys
   that *are* ICU-processed keep the `''` escape. **Rule for message edits: a plain `'` in anything read
   through `t.raw(...)` (the `sections`/`steps`/`cards`/`body` collections), `''` everywhere else.**
3. The doubled apostrophes were only visible because the spec asserts the reference's own prose. The
   first-run failures that were *not* product defects were the spec's own and were fixed, not tuned
   around: the landmark assertion counted the two guide `<nav>`s while a third (`Breadcrumb`) sits in the
   same `<main>` (now pinned as "no two landmarks share a name", with the pager's new
   `topicNavLabel` → "Topic navigation" distinct from "User guide contents"), and heading lists were
   read with a bare `allInnerTexts()` that could run before the streamed page body arrived — the
   `(public)/loading.tsx` skeleton that flushes first renders decorative blocks and a `role="status"`
   line, **no headings** — so they are now pinned with the auto-retrying `toHaveText([...])`.
4. `home-departments`' "still a disclosure" test could click the pre-hydration placeholder
   (`lazy-nav.tsx` → `DepartmentMenuFallback`): it repeats the trigger's accessible name *and* its width
   class, is visible immediately, and has no behaviour, so the click opened nothing. The test now waits
   for the real trigger's `aria-haspopup` before interacting. (The placeholder is intentional — the
   islands mount from their own chunks to keep public first-load inside budget — so the fix belongs in
   the test, not the header.)

### Final gate (2026-10-14, after all of the above)

| Gate | Evidence | Result |
|---|---|---|
| Production build (`next build`, Turbopack) | `backend/build-run16.log` | ✓ compiled in 18.8s, 83/83 pages, `BUILD_ID VcFBeOtTJNY8mRR3VMebD` |
| Types + lint | `npx tsc --noEmit`, `npx eslint` (`frontend/`) | ✓ clean; the e2e specs are type-checked and run by Playwright |
| Playwright e2e (whole suite, standalone build + Kestrel) | `tests/e2e-final15.log` | ✓ **24/24** in 3.4m (editorial 6, home-departments 4, responsive 3, rfq 4, security-headers 2, smoke 5) |
| Backend tests | `backend/dotnet-test-run16.log` | ✓ **231/231** (45 unit + 12 architecture + 2 security + 172 integration) |
| API traffic during the e2e run | `backend/api-run16.log` | 1230 × 200, 241 × 401 (documented anonymous session reads), 12 × 499 (aborted SSR reads), **0 × 429**, 0 × 5xx, 3 registrations |

## Visual-parity pass: the reference's own skin (2026-10-14)

Owner instruction: on the public surface the reference's own styles, icons and colours take precedence
over our skin (the workspace keeps our design system — the reference has no equivalent surface).

Method: one load per probe against the live site at 1440px (respecting `Crawl-delay: 10`), recording
computed styles and geometry — `tests/skin-probe.mjs` (header/masthead/nav/search), `detail-probe.mjs`
(vertical menu, section headings, product cell, footer blocks), `extra-probe.mjs` (footer titles,
section rhythm, card internals, hero), `extra2-probe.mjs` (the "View All" link, the heading link, the
footer bottom bar, the flyout rule) → `tests/audit/*.json`; then the same boxes re-read off our
standalone build with `tests/ours-probe.mjs` → `tests/audit/ours-skin.json`. The full comparison table
and the deviation list live in `PARITY.md` §5b; this is the build record.

What the measurements changed:

- **Header** — three rows at the measured heights (38px signal bar with 13px type, 92px dark masthead,
  50px signal menu row with its two 1px `rgba(204,204,204,.5)` rules), masthead links at 14px, main-nav
  links at 16px/500 `#020202` with 20px gaps.
- **Department panel** — the trigger is the theme's transparent 300×50 block (no glyph, no fill), the
  list is the theme's white 300px column (`padding: 15px 0 14px`, hairline bottom, 20px row icons), and
  the rows are real `<Link>`s to the department — the reference's `.level0 > a.level-top`, not
  buttons. The non-home disclosure keeps the same markup inside a popover.
- **Section headings** — `.top-title` rhythm: `padding: 5px 20px`, 24px/500 heading as the link, the
  "View All" link at 16px/400 on the right, sections 30px apart.
- **Product cell** — square 163px image with no border or radius, title 14px/400, no CTA. Six across
  from 1200px (the reference's `col-lg-2`): this needed a `home-product-grid` utility, because
  Tailwind v4 emits `min-[1200px]:` blocks *before* the named `lg:` block, so
  `lg:grid-cols-4 min-[1200px]:grid-cols-6` silently resolves to four — the same trap already
  documented for `department-block` in `globals.css`.
- **Footer** — 1px `#e1e1e1` rule, `padding-top: 50px`, 16px/500 `#666666` column titles, 16px/400
  `#020202` links, the reference's 4/3/2/3 column proportions (our old grid summed 4+3+3+3 = 13 of 12
  and wrapped, which is why it measured 561px against the reference's 492px), brand-coloured social
  glyphs, 14px/400 copyright.
- **Icons** — the reference's 22 `mbi-*` glyphs rebuilt from open Font Awesome Free 6.7.2 into
  `src/lib/reference-icons.ts` (generator: `tests/gen-reference-icons.mjs`), drawn by
  `components/ui/reference-icon.tsx` and wired into the department rows, the footer socials and the
  mobile dock. Provenance and licence: `PARITY.md` §5c.
- **Buttons** — `rounded-[3px]` + `font-medium` + `border-y border-ink` + `px-[15px]`; heights stay ours
  (44px) so the WCAG target-size floor is untouched.
- **The templates we mirror** — a second probe (`tests/template-probe.mjs`, three reference loads)
  measured the page title and block title on a real category and a real product
  (`/en/building-materials.html`, `/en/mm-distributors-tv-wall-installation.html`, both taken from the
  reference home's own links). The catalogue `h1`, which had used the design system's display clamp,
  is now the reference's 24px/400 `#020202`; the 11px uppercase accent eyebrows became the reference's
  16px/400 uppercase `.block-title`; the product price became the measured 24px/500; breadcrumbs went
  from 10px micro to the reference's 14px. Both heading voices live once in `globals.css` as the
  `page-title` and `block-title` utilities, with their provenance in the comment beside them.

Home height went 4292px → ~3643px against the reference's 3514px; the residue is the hero graphic's
aspect plus our two added bands.

### Gates after the visual pass (2026-10-14)

| Gate | Evidence | Result |
|---|---|---|
| Reference measurement, home surfaces | `tests/skin-probe.mjs` → `detail-probe` → `extra-probe` → `extra2-probe`; `tests/audit/*.json` | 4 loads, one page each, `Crawl-delay: 10` respected |
| Reference measurement, the templates we mirror | `tests/template-probe.mjs` → `tests/audit/template.json` | 3 loads (home → category → product); both URLs are real links taken off the reference home page |
| Our own boxes re-read | `tests/ours-probe.mjs` → `tests/audit/ours-skin.json` | header 182px against the reference's 180 (our menu row is 52px from its own two 1px rules), department column 300×486, 163px square cells, six across at 1440 |
| Public templates render with the new type | `tests/shot-ours.mjs` → `tests/audit/ours-*-1440.png` | ✓ `/en`, `/products`, `/categories/building-materials`, `/products/welding-head-shield`, `/suppliers/cimco-metal-centre` — all 200, real data, real `h1`s |
| Types + lint | `npx tsc --noEmit`, `npx eslint src` | ✓ clean |
| Production build (`next build`, Turbopack) | `backend/build-run22.log` | ✓ compiled in 4.6s, 83/83 pages |
| Playwright e2e (whole suite, standalone build + Kestrel) | `tests/e2e-final19.log` | ✓ **24/24** in 2.3m |
| Backend tests | `backend/dotnet-test-run17.log` | ✓ **231/231** (45 unit + 12 architecture + 2 security + 172 integration) — unchanged by the visual pass, which touched no backend code |
| API traffic during the run | `backend/api-run21.log` | 1320 × 200, 4 × 201, 240 × 401 (documented anonymous session reads), 111 × **429** (104 × `/catalog/categories` + 7 × `/catalog/products`, all inside one 16-second window — the documented anonymous-read partition, **300/min**, shared by SSR), 24 × 499 (aborted SSR reads), **0 × 5xx** |

The 429s are the known SSR-partition limitation, not a regression: all 24 specs passed while they were
happening, which is B14's containment doing its job. The same suite has also produced **0 × 429** on a run
whose burst fell differently inside the minute (`backend/api-run16.log`, above); the fix is still the
deployment-topology one.

## News surface: the reference's editorial tree, migrated and served (2026-10-14)

The last placeholder on the public surface is real content now: the reference's news tree is migrated
into our own tables and served by our own endpoints at the reference's own paths. Nothing on this
surface is invented — every title, body, date, bucket and tag is the reference's own.

**What the reference actually publishes.** `tests/news-harvest.mjs` walked its index *by paging*
(13 pages; page 14 repeats page 1, so paging stops at 15) instead of trusting its sitemap: the sitemap
omits the newest posts entirely, which is why an earlier reading counted 58. The tree is **73 linked
posts, 72 live**. One slug (`completed-projects-chip-flake-flooring-rooftop-katugasthota-2026-sl-enterprises`)
answers with the reference's own search page — dead on the reference itself — so it is **not seeded**.
**71 posts were captured and all 71 are healthy** (status 200, body ≥ 200 chars, 0 undated, 0 empty).
Two slugs carry a **literal space** because the reference's own hrefs do; they are kept verbatim rather
than "repaired".

**The dataset** (`tools/content-migrate/` → `out/articles.json`, the seeder's auditable input), 71
articles: kinds **54 `ProjectCaseStudy` / 12 `NewsArticle` / 5 `SupplierStory`**, and buckets
**`completed-jobs` 54 / `stockpile` 10 / `suppliers` 5 / `features` 1** plus one post the reference
leaves uncategorised. The kind mapping is the reference's own labelling (`completed-jobs` →
`ProjectCaseStudy`, `suppliers` → `SupplierStory`, `stockpile`/`features`/uncategorised →
`NewsArticle`) — no guessing past what its own pages say. Bodies are the reference's
`.post-description` HTML with the theme's furniture dropped (featured-image block, tag list, `TAGS`
heading), attributes stripped, and body anchors unwrapped to their text, because their hrefs point at
the reference site. The posts reference **364 images, none ingested** — see the limitations.

**Sinhala is not translated, and we do not pretend otherwise.** Verified on the reference 2026-10-14:
its `/si/news/post/…` store view serves the *English* article with Sinhala chrome only. No Sinhala
content rows exist; `ContentStore` falls back to `DefaultLocale` (`ResolveLocaleAsync` for lists, a
second lookup in `GetArticleAsync`) and this surface reaches Sinhala through the message catalogs. The
evidence sits in the store's own comments.

**Backend.** `GET /content/articles` (paged; tri-state `kind`/`tag`/`category` — absent = any, a list =
one of these, an empty list = matches nothing), `GET /content/articles/{slug}`, `GET /content/categories`.
Uniqueness is `(Locale, Slug)`, because the reference serves the same slug under both store views. Tags
travel as `{slug, name}`: the reference's chips link to `/news/tag/{slug}` with a lowercased slug
(`TOR` → `tor`), which our `Slugify` already produced, so the contract carries both halves.

**Frontend.** `/news`, `/news/post/{slug}`, `/news/category/{slug}`, `/news/tag/{slug}`, with
`NewsShell` (multi-crumb), `ArticleCard` and `ArticleBody`. The list renders each post in **full** under
its heading, because that is what the reference's list item does, so `ArticleSummary` deliberately
carries the body and the list is paged at **6** (the reference's page size) so the extra weight costs no
N+1 reads. The hub bar gains the reference's own fifth link, News, in its own order (`Get Quotes How It
Works News About Us Help`); the reference's *footer* has no News link, so ours has none either.

**The body renderer is the app's one audited HTML injection point.** eslint forbids
`dangerouslySetInnerHTML` everywhere (security-test-matrix I8/X11) and its comment says the rule's
scope will narrow "when the sanitized renderer arrives" — this slice is that arrival.
`src/lib/html/sanitize-article-html.ts` *verifies* rather than rewrites: a body becomes markup only
when every tag is allow-listed, none carries an attribute, and no `<` survives outside those tags (the
whole proof is that an HTML parser only starts a tag at a `<`), and otherwise the entire body is
escaped to text; `src/components/ui/sanitized-html.tsx` is the single file the rule is scoped off for.
Checked directly against the dataset: **all 71 stored bodies pass the allow-list and pass through
byte-identical**, so nothing silently degrades to escaped text. `tests/e2e/sanitized-html.spec.ts` is
the guard's selftest — it proves the classifier fires on script, event-handler, attribute, comment and
stray-`<` input, and that a live article still renders its table and cells as elements. Two project docs
were corrected with it: `docs/security-test-matrix.md` (I8) and `docs/security-threat-model.md` both
credited an *architecture test*, but no backend test ever covered this and this Next version does not
lint during `next build`, so both now name the eslint gate and the sanctioned renderer.

**The bucket and tag pages filter; the reference's own do not** (deviation 8, PARITY.md §5b).
Captured: `.../en/news/category/suppliers` is headed "Suppliers" yet lists the six *Completed Projects*
posts the index opens with — its category listing ignores its own filter. We apply it, because a URL
that names a bucket must mean that bucket. A slug that is not one of the four buckets → the not-found
page; a bucket with no posts → the empty state; a tag exists only through its posts, so a tag slug with
none → the not-found page.

**One app-wide behaviour, recorded rather than reworked:** unknown detail URLs (news, products and
suppliers alike) answer **HTTP 200** with the app's 404 page rendered, because `(public)/loading.tsx`
streams the shell before the page component resolves and `notFound()` can no longer set the status. The
reference answers 404 there. The API is the authority and *does* refuse: the clean 36-spec run's traffic
shows the API answering 404 for the unknown article slug (**2 × 404**, both
`GET /api/v1/content/articles/not-an-article`), and the bucket/tag guards are decided from the
`/content/categories` list and a zero-post page rather than by a 404. Changing the page status would mean
restructuring the streaming shell for every public route, so it is listed as a residual instead of being
silently changed at the end of a content slice.

**The seeder had a real race and `dotnet test` found it.** Run 18 failed with
`IX_ContentCategories_Slug … (completed-jobs)` in `Stockpile.SecurityTests`: `IntegrationTests` and
`SecurityTests` boot hosts concurrently against `Stockpile_Test` (AutoMigrate on) and the seed gate was a
read-then-write, so both hosts saw "no rows, no marker" and both inserted the same buckets.
`ContentSeeder` now takes a transaction-owned app lock (`sp_getapplock @Resource='stockpile:content-seed'`,
`@LockOwner='Transaction'`, `@LockTimeout=-1`) and re-reads the gate **inside** it, so the loser waits and
then short-circuits. `tools/content-migrate/reset-content.sql` is the supported reset of the five content
tables plus the marker.

**Gates (2026-10-14).**

| Step | Evidence | Result |
|---|---|---|
| API reads after the rebuild (dataset contract) | `backend/api-run26.log` | ✓ 71 rows **with `body`**; `locale=si` 71 (fallback); `kind=ProjectCaseStudy` 54, `NewsArticle` 12, `SupplierStory` 5; buckets `completed-jobs` 54, `stockpile` 10, `suppliers` 5, `features` 1 (one post uncategorised); `tag=steel` 1 |
| Production build | `frontend/build-news-3.log` | ✓ compiled, **85/85** static pages; the four news routes render per request (`ƒ`), like the catalogue detail routes |
| Playwright e2e (whole suite) | `tests/news-e2e-full-2.log` | ✓ **36/36** in 2.9m — the 8 news specs, the 3 sanitized-renderer guard specs, the 4 news routes added to the overflow gate, and the 24 that already passed |
| Backend tests | `backend/dotnet-test-run21.log` | ✓ **231/231** (45 unit + 12 architecture + 2 security + 172 integration) |
| API traffic, one clean 36-spec run | `backend/api-run27.log` | 1340 × 200, 4 × 201, 1 × 204, 1 × 400 (the suite's own `INVALID_RESET_TOKEN` case), 273 × 401 (documented anonymous session reads), **2 × 404** (both the not-found spec's unknown article slug — the API is the authority), 43 × 429 (the documented anonymous-read partition; every spec still passed), 15 × 499 (aborted SSR reads), **0 × 5xx** |
| The renderer over the real data | direct check of `tools/content-migrate/out/articles.json` | ✓ **all 71 bodies** pass the allow-list and pass through **byte-identical** — nothing degrades to escaped text |

Three existing guards shaped the code and are worth knowing about. `RawSqlInterpolationTests` (I5)
classifies the *whole* argument list of a raw-SQL call and sanctions exactly the one-const-name shape, so
the app-lock call carries a documented `CA2016` suppression rather than `, ct`. The controller rules
(a permission policy or `[AllowAnonymous]` per action, `[EnableRateLimiting]` per mutation) passed
unchanged for `ContentController`, whose reads are anonymous under the anonymous read policy. And the
frontend's I8/X11 tripwire refused `dangerouslySetInnerHTML` outright until the sanctioned renderer
existed — see the body-renderer note above.

## Resumable registration drafts (residual #4a) (2026-10-14)

Registration used to be one atomic submit in both flows: close the tab halfway through the supplier form and the
typing was gone. This slice makes the **prefill** survive — without ever creating an account and without ever
storing a password.

**The mechanic.** A visitor's non-secret fields are autosaved (1.5 s after the last keystroke, best-effort) to a
server-side `RegistrationDraft` via `POST /api/v1/auth/registration-drafts` with
`{kind, draftToken?, email?, …, categories?[]}`. A blank or absent `draftToken` mints one — 32 random bytes,
base64url — and answers **200** `{draftToken, kind, expiresAtUtc, prefill}`; a *live* token updates that same
draft. `POST /…/resume` hands the prefill back from the token alone, and the token rides the final
`POST /auth/register` / `/auth/register/supplier`, which **retires** the draft. Only the **SHA-256 hash** of a
token is persisted (unique index), so a database read never yields a usable token; the entity has **no password
member at all** (a reflection test guards it), and `Auth:RegistrationDraftExpiryHours` (default 72, validated
`[1,720]`) bounds how long a dead token lingers — an opportunistic sweep on each mint deletes expired rows.

**One identical 404.** Unknown, expired, retired, and *foreign-flow* tokens (a buyer draft presented to the
supplier form) all answer the same `404 RESOURCE_NOT_FOUND`. The reason never leaks, so the endpoint is not an
oracle for "does this token exist?" — the same BOLA shape the RFQ owner reads use. The save answers **200, not
201**: it is an idempotent upsert of a transient prefill with no canonical GET URL of its own, so there is no
`Location` to give.

**Why a persisted row and not a cookie.** The draft has to survive the browser restart that motivated it, and it
must be checked server-side: a cookie the client could rewrite would let a visitor resurrect arbitrary prefill for
a token it never held. The token is a *capability to the visitor's own prefill*, nothing more.

**Frontend.** `frontend/src/lib/registration/draft-storage.ts` keeps only `{draftToken, expiresAtUtc}` in
`localStorage` (versioned key, one per flow, try/catch around every access so private mode degrades to "no
draft"). The supplier form resumes on mount and autosaves its non-secret fields (never `password`); the buyer
form does the same for the email. A restored value **never overwrites something already typed**
(`restore(typed, saved)`), the register call carries the token, and the handle is cleared on success — and on any
resume 404, so a dead handle is never retried. The refill is deliberately silent: this is our own auth surface
(not the reference's), and no new copy was invented for it.

**Deviation from the design doc.** business-flows §2 drew the `draftToken` as issued *by step 1*, after the
account exists. Here the token exists **before** any account, because the thing worth saving is the prefill a
visitor abandons *before* they ever submit — and a draft that required an account first could not serve that case
at all. §2/§3 now say so.

**Gates (2026-10-14).**

| Step | Evidence | Result |
|---|---|---|
| Backend tests | `backend/dotnet-test-regdraft-2.log` | ✓ **240/240** (45 unit + 12 architecture + 2 security + **181** integration) — the 9 new draft tests cover hash-at-rest (never the token), live-token update of the same row, identical 404 for unknown and foreign-flow tokens, 422 for an unknown `kind`, retire-on-complete, expiry + sweep, and the reflection guard that no draft type carries a password member |
| Migration | `backend/ef-add-1.log`, `backend/ef-update-1.log` | ✓ `20261014102543_AddRegistrationDrafts` created and applied to `Stockpile_Dev` (single snapshot updated in place) |
| Production build | `frontend/build-regdraft-1.log` | ✓ compiled, **85/85** static pages, standalone output |
| Lint / types | `frontend/eslint-regdraft-1.log`, `frontend/tsc-regdraft-1.log` | ✓ both exit 0 (the React Compiler-era `react-hooks/set-state-in-effect` rule rejected the first readiness design — see below) |
| Playwright e2e (whole suite) | `tests/regdraft-e2e-full-1.log` | ✓ **39/39** in 2.4m — the 3 new specs (supplier reload restore including a category tick and an empty password field, buyer email restore, dead token forgotten) plus the 36 that already passed |
| API traffic, one clean 39-spec run | `backend/api-run28.log` | 1237 × 200, 4 × 201, 1 × 204, 2 × 400, 272 × 401, **2 × 404** (the two dead-token probes — the resume endpoint working as designed), 178 × 429 (the documented anonymous-read partition under full-suite load; every spec still passed), 24 × 499, **0 × 5xx**; 6 calls to the draft endpoints, every one 200 |

One guard shaped the frontend and is worth knowing about. The current React rules include
`react-hooks/set-state-in-effect`, which rejects calling `setState` directly in an effect body — so "is the
resume finished yet?" is a **ref** (`resumeSettledRef`), not state: the autosave effect reads it and re-runs when
the restored values land, which avoids both the cascading render and the initial blank-draft write.

---

## Buyer setup wizard: profile, organisation, preferences, notifications (residual #4b) (2026-10-15)

Account setup used to be one profile form on `/workspace`. It is now the four steps the flow implies, each a
real endpoint, each independently idempotent and resumable — complete them in any order, return to any one
later, and the server holds the answer:

| Step | URL | Endpoint |
|---|---|---|
| 1 Profile | `/wizard/profile` | `GET`/`PATCH /api/v1/me/profile` |
| 2 Organisation | `/wizard/organization` | `POST /api/v1/organizations` (existing, §2.1) |
| 3 Preferences | `/wizard/preferences` | `GET`/`PATCH /api/v1/me/preferences` |
| 4 Notifications | `/wizard/notification-preferences` | `GET`/`PATCH /api/v1/me/notification-preferences` |

**Storage with no migration.** Every scalar is one `UserPreference` row keyed by the **caller** (`(UserId, Key)`
is already the primary key): `profile.role`, `profile.location.NNN`, `profile.interest.NNN` (the index is
zero-padded `D3`, so the list reads back in the order it was written rather than in string order), and
`notifications.quote`. The chosen language is not a preference row — it is `User.PreferredLocale`, the column
the domain already had — and the notification channels are `NotificationPreference` rows under
`Category = "rfq"`, the table that already existed. Nothing new reached the schema, so this slice adds **no
migration**.

**PATCH merges per member.** `null` leaves the stored value untouched, an empty list clears that list, and an
empty `Role` string clears the role. A step therefore never has to read a value back before writing the one it
changed, and a client that sends only the members it edited cannot erase the ones it did not mention. The write
path deletes the rows under the prefix being replaced (`ExecuteDeleteAsync`, which runs immediately, so the
replaced prefix is gone before the re-add) and inserts the new rows in one `SaveChangesAsync`.

**Validation splits two ways.** FluentValidation (→ **422**) rejects a role outside the fixed set, a list longer
than **25**, an entry longer than **120**, and a *blank* entry (named as `procurementLocations[N]`). The use case
then trims padded values and drops duplicates, so `"Colombo"`, `"Colombo "`, `"Colombo"` stores one entry —
both behaviours keep their own test, because "rejected" and "normalised" are different promises.

**Authorisation is the server's, per principal.** Every action resolves the caller from the `sub` claim and
hands only that id to the store, so one buyer can never read or write another's rows (the isolation test asserts
it). Writes carry `me.profile.write` / `me.preferences.write` / `me.notification-preferences.write` at
**60/hour** and audit `user.profile.updated` / `user.preferences.updated` /
`user.notification-preferences.updated`. A subject that no longer resolves to a user answers a single
`401 UNAUTHENTICATED` — deliberately, so a read can never return an empty profile that would read as "this
account has no preferences".

**Frontend.** Four steps behind one shared stepper (`components/auth/wizard-shell.tsx`), rendered in the guarded
`(workspace)` chrome but resolving to top-level `/wizard/*` URLs — so `src/proxy.ts` now lists `/wizard` in
`PRIVATE_PREFIXES` (a route group does not change a URL, and the wizard was **not** shell-guarded until it did).
The role, province and district values are the backend's own codes: geography is **transcribed** from
`DbSeeder` into `src/lib/geography.ts` (9 provinces / 25 districts, lowercase slugs) because there is no public
geography endpoint to read, and the **province is derived from the district** client-side so the pair can never
disagree with the seeded reference data. Step 2 refuses the duplicate it exists to prevent: when
`useSession().user.orgMemberships` is non-empty the step reports the existing organisation and offers Continue,
and never posts a second one. `/workspace` carries a permanently honest "Account setup / Open setup" card, since
the wizard is also the edit surface.

**Two defects the gates found — both real, both fixed.**

1. **Read-then-fill race.** Each step reads its stored answer on mount and applies it to the form. The read is a
   round trip and the buyer does not wait for it, so a value typed before the answer landed was **silently
   overwritten** by the (still empty) server state — and the PATCH that followed then stored nothing. The browser
   suite hit it exactly as that description: `GET /me/profile 200`, `PATCH /me/profile 200`,
   `GET /me/profile 200` — and the role read back empty. Each of the three read-then-fill forms is now **inert
   until its own read settles** (`aria-busy`, every field disabled), so the server's answer can never land on top
   of typing. The same window existed on step 2 the other way round: membership is what decides which of the
   step's two states it shows, so before the session resolved a member could have been shown the create form and
   could have minted a second organisation — that form is inert until the session resolves too. The settled flag
   is a `useState` written only from the async callback, never synchronously in the effect body: the current
   `react-hooks/set-state-in-effect` rule rejects the latter, and the lock is derived (`status === "loading"` →
   locked) rather than forced through an effect.

2. **360px horizontal overflow in Sinhala.** The shared button chain says `whitespace-nowrap`, which is right for
   the short action labels it was written for and wrong for a translated one: Sinhala "add a team member" is
   roughly twice the English, and a nowrap label is a *min-content floor* a flex column cannot shrink below — so
   step 2's members box measured **385px inside a 360px viewport**. Fixed by `label-wrap` in `globals.css`: an
   **unlayered** rule (the one departure from that file's layering, for the reason `typography.css` documents —
   unlayered beats every `@layer`, so it wins over the utility chain without `!important`), with `height: auto`
   so the fixed `h-11` cannot clip a second line. It is written this way on purpose: Sinhala is not covered by
   the self-hosted Open Sans, so it renders in whichever system Sinhala face the machine has, and the layout must
   be safe by construction rather than by measuring one font. Step 2's Sinhala label was shortened to its natural
   short form as well, so it still fits on one line here.

   The responsive spec had its own bug that made the failure hard to read: next-intl remembers the locale in a
   cookie, so an "English" path measured *after* the spec's `/si/workspace` visit is really the Sinhala page.
   English paths now run first and every Sinhala path is spelled out in full — and the wizard is measured in
   **both** locales, Sinhala being the harder case twice over (longest copy, system fallback face).

**Gates (2026-10-15).**

| Step | Evidence | Result |
|---|---|---|
| Backend tests (full) | `backend/dotnet-test-wizard-me2.log` | ✓ **251/251** — 45 unit + 12 architecture + 2 security + **192** integration |
| New wizard API tests | `backend/dotnet-test-profiles1.log` | ✓ **11/11** filtered (`Profiles`) — the six endpoints, per-principal isolation, the partial merge, the reject/normalise split, and the 401 floor |
| Production build | `frontend/build-wizard-me3.log` | ✓ compiled, **93/93** static pages, standalone output |
| Lint / types | `frontend/eslint-wizard-8.log`, `frontend/tsc-wizard-8.log` | ✓ both exit 0 |
| Playwright e2e (whole suite) | `tests/wizard-e2e-7.log` | ✓ **41/41** in 3.7m — the new 2-spec wizard file (walk every step, then re-read each one after a full reload; plus the signed-out guard) and the responsive suite extended to the wizard in both locales |
| API traffic, that 41-spec run | `backend/api-run-wizard-5.log` | 1447 × 200, 6 × 201, 1 × 204, 3 × 206, 2 × 400, 286 × 401, **2 × 404**, 92 × 429 (the documented anonymous-read partition under full-suite load), 80 × 499 (client navigation aborts), **0 × 5xx**; every wizard call that completed answered 200 — `profile` 3×GET/1×PATCH, `preferences` 2×GET/1×PATCH, `notification-preferences` 2×GET/1×PATCH |

---

## Supplier onboarding after the account exists: profile, service areas, categories (residual #4c) (2026-10-15)

§3.3's supplier table has seven stages and the registration form submits **stages 1–5 in one atomic call**
(`POST /auth/register/supplier`). That call still exists and is still the only way to create a supplier — but
the stages were terminal: whatever the form captured at signup was what the supplier was stuck with. A signed-in
supplier now has its own resumable surface, on the same terms as the buyer wizard (residual #4b above):

| Stage | URL | Endpoint |
|---|---|---|
| 2 Person + 3 Business | `/supplier/setup/profile` | `GET /api/v1/suppliers/me`, `PATCH /api/v1/suppliers/me/profile` |
| 4 Location | `/supplier/setup/service-areas` | `PUT /api/v1/suppliers/me/service-areas` |
| 5 Categories | `/supplier/setup/categories` | `POST`/`DELETE /api/v1/suppliers/me/categories[/{slug}]` |

Stages 6 (verification documents) and 7 (plan selection) are deliberately **absent**: there is no documents or
subscriptions subsystem to write to, so a step for them would be a control with nothing behind it. The rail ends
at stage 5 and the gap is recorded rather than papered over.

**Ownership is resolved from the organisation, never from the request.** The caller's supplier is found by
joining their *accepted* `OrganizationMembers` rows to `Suppliers` on `OrganizationId`; the route carries no
supplier id at all, so there is nothing for a caller to tamper with. A signed-in account with no supplier gets
**one** `404 RESOURCE_NOT_FOUND` from every route — the same answer whether the supplier does not exist or
belongs to somebody else — so the surface can never be used to probe for other suppliers (BOLA). The four writes
additionally require the `supplier.update.own` capability, so a plain member of the organisation can read the
summary but not rewrite it (`403 INSUFFICIENT_CAPABILITY`).

**The store answers data questions; the service answers policy questions.** `SupplierSelfStore` exposes focused
operations (`ResolveSupplierIdAsync`, `GetSelfAsync`, `UpdateProfileAsync`, `ResolveCategoryIdAsync`,
`AddCategoryAsync`, `RemoveCategoryAsync`, `AllDistrictsExistAsync`, `SetServiceAreasAsync`); the service owns
identity resolution, normalisation, turning "unknown slug/district" into a `422` naming the field, and the audit
trail (`supplier.profile.updated`, `supplier.categories.updated`, `supplier.service-areas.updated`). Only *shape*
lives in FluentValidation: whether a category slug or district code exists is a question for the catalogue and
the reference geography tables, so it is answered in the store against real rows rather than against a hard-coded
list. The catalogue remains the authority in both directions — the picker is handed the same public category tree
the backend validates against.

**The partial merge keeps `null` and `""` apart.** `null` means "not mentioned, leave it"; `""` means "clear it".
The service preserves that distinction (`Keep(value) => value?.Trim()`) and the store collapses a blank to `null`
on write (`NullIfBlank`), so a client can send only the members it edited. One member may never be blanked: a
provided `CompanyName` must be non-empty, because blanking the supplier's own display name is not a merge, it is
a hole. Service areas are the exception to merging — the district set is **replaced** in one transaction
(`ExecuteDeleteAsync` on the caller's rows, then the new set, committed together), because "the districts I
serve" is a declaration, not an accumulation. Category coverage is the opposite: add is **idempotent** (re-adding
is a no-op, not a duplicate row) and remove by slug answers `404` once the row is gone, so a retry is always safe.

**Writes answer `200` with the caller's whole aggregate, not `201`/`204`.** The write merged state rather than
creating an addressable resource, and re-POSTing a category is a no-op — a `201 Created` would be a lie on the
retry. Returning the full `SupplierSelfResponse` also means the client never has to re-read to know what the
server now holds. Each of the four writes carries its own `[EnableRateLimiting]` (`supplier.profile.write`,
60/hour), which the architecture gate requires of every mutating action.

**One route shape is unusual, for a real reason.** Category slugs are materialised paths
(`building-materials/timber/plywood`), so the delete route is a catch-all
(`DELETE /suppliers/me/categories/{**slug}`) — a single-segment parameter would not match a nested path.
The literal `/suppliers/me` segment also has to win over the public directory's `/suppliers/{slug}`, which the
API tests pin (an anonymous `GET /suppliers/me` answers `401`, never a directory hit for a supplier named "me").

**Frontend.** `/supplier` (the desk) carries a setup card; the rail itself is `components/supplier/supplier-setup-shell.tsx`
and the three steps are client forms that each read their stage on mount and stay **inert until that read
settles** — the same race the buyer wizard hit, handled the same way (`aria-busy`, every field disabled, the
settled flag written only from the async callback so `react-hooks/set-state-in-effect` stays satisfied). A
supplier whose account has no supplier row sees one honest panel (`SupplierSetupMissing`, driven by the `404`
envelope code) instead of an empty form. The service-areas picker is the transcribed reference geography, and the
default district can only be one of the ticked districts because the select offers nothing else — removing the
one mismatch the backend would have to refuse. The categories step hands the backend the **diff**: it reads the
covered set, and submits only the additions and removals, **sequentially** rather than with `Promise.all`, since
each response refreshes the antiforgery token. `/supplier/setup` itself is a redirect to the first step, and the
whole surface sits behind `/supplier` in `src/proxy.ts` (already listed), so no new guard prefix was needed.

**Gates (2026-10-15).**

| Step | Evidence | Result |
|---|---|---|
| Backend build | `backend/build-supplier-self5.log` | ✓ **0 warnings, 0 errors** (the first build carried 6 analyzer warnings in the new test file — hoisted to `static readonly` arrays and a `static` helper, so the tree stays warning-free) |
| Backend tests (full) | `backend/dotnet-test-supplier-self4.log` | ✓ **256/256** — 45 unit + 12 architecture + 2 security + **197** integration |
| New supplier API tests | `backend/dotnet-test-supplier-self2.log` | ✓ **5/5** filtered (`SupplierSelfApiTests`) — the 401/403/404 floor, per-supplier isolation, the merge/clear/re-read behaviour, idempotent add and remove, and the replace-not-append service areas |
| Lint / types | `frontend/eslint-supplier-setup2.log`, `frontend/tsc-supplier-setup2.log` | ✓ both exit 0 |
| Production build | `frontend/build-supplier-setup2.log` | ✓ compiled, standalone output, the four `/supplier/setup/*` routes present |
| Playwright, the new spec alone | `tests/supplier-setup-1.log` | ✓ **2/2** in 58.5s — register → desk card → all three stages → re-read every stage after a full reload → both locales at all seven widths |
| Playwright, whole suite | `tests/supplier-setup-full-1.log` | ✓ see the run record below |

The overflow measurement for the supplier routes lives in the new spec rather than in `responsive.spec.ts`,
for a budget reason: `auth.register` allows **5/hour/IP** and the suite already spends four registrations, so
a fifth spec that registers a supplier is the last one available — a supplier session is what renders the real
stage layouts, and the measurement itself is shared (`tests/e2e/support/overflow.ts`), extracted from
`responsive.spec.ts` so the subtle part (viewport, shell attached, fonts settled) is written once.

---

## Remaining dependencies / limitations (honest list)

| Area | Limitation | Where it surfaces |
|---|---|---|
| Supplier onboarding | ~~No vendor-registration endpoint; supplier CTAs go to `/register` (buyer signup)~~ **Resolved 2026-10-14**: `POST /api/v1/auth/register/supplier` + `/supplier-register`, and every supplier CTA now targets it (B15). Submit stays a **single atomic call**, and a half-finished form is now **resumable** (residual #4a): a server-side registration draft holds the non-secret prefill behind an opaque `draftToken`, so an abandoned application comes back instead of being lost. The buyer §2 four-step flow is now built (residual #4b, above), and so are §3.3's supplier stages 2–5 (residual #4c, above); stages 6–7 stay open because there is no documents or subscriptions subsystem to write to | how-it-works-for-suppliers, pricing, supplier-login, header |
| RFQ submission | ~~No public RFQ endpoint; `/quotations` and `/contact` use `mailto:`/tel, no form~~ **Resolved 2026-10-14**: the org-owned `POST /rfqs` → `/submit` flow + `/rfq` form (B16); `/quotations-and-estimations`' primary CTA is the real form (mailto kept as an alternative). Honest residual: matching is **category-overlap only, capped at 50** | rfq, quotations-and-estimations |
| RFQ supplier response | A supplier can be *matched* to an RFQ, but no screen lists a supplier's open invitations or submits a quote — what was built is the buyer-side create/submit/list. The `quote.*` capabilities exist in the permission model but no UI consumes them | supplier workspace |
| Plan subscription | Pricing tiers are informational; no checkout/wiring (call `0114-222-555` + Learn More are the actions) | pricing |
| Supplier logos | ~~Directory API has no logo field~~ **Resolved**: catalogue seeder links `Logo` MediaAssets; directory/microsite/home render logos when present | home "Newest Suppliers", suppliers pages |
| Partner-buyers strip | No data source → the "OUR PARTNERED BUYERS" logo strip is omitted | how-it-works-for-suppliers |
| News | ~~No endpoint/data~~ **Resolved 2026-10-14** (+ heroes): 71 posts at `/news…`; hero bytes via `ingest-heroes.mjs` → `ContentSeeder` → `HeroImageMediaId`. Residuals: body inline images not ingested; view counter / comments / prev-next omitted | hub bar, `/news` |
| News on the home page | ~~omitted~~ **Resolved**: `NewsBand` after Newest Products (`getArticles` page 1) | home |
| Magento `.html` URLs | ~~different scheme only~~ **Resolved**: 308 map in `proxy.ts` from catalogue seed (`magento-html-redirects.json`) | SEO / bookmarks |
| Dead-slug handling in the news harvester | `tests/news-harvest.mjs` has no *DEAD* classification: a slug the reference itself 404s (it serves its search page) is reported as a capture failure and the operator decides. One such slug is recorded in the news section above and is not seeded; the tooling was left as-is | `tests/news-harvest*.log` |
| Not-found responses stream `200` | Every public detail route (news, products, suppliers) answers **HTTP 200** with the app's 404 page rendered, and the reference answers **404**: `(public)/loading.tsx` streams the shell before `notFound()` can set the status. The API stays the authority (it answers `RESOURCE_NOT_FOUND`; the clean 36-spec run shows 2 × 404, both the not-found spec's unknown article slug). Fix (not applied — it restructures the shell for every public route): move the detail reads into `generateMetadata` + a route-level guard, or drop the shared `loading.tsx` in favour of per-route skeletons | any unknown detail URL |
| Catalogue seeder's identical latent race | `CatalogueSeeder` shares the read-then-write gate shape that failed run 18 for the content seeder, but takes no app lock: two concurrent first-boot hosts against one empty database can still collide on `IX_ContentCategories_Slug`. Left alone deliberately (every database that boots today already holds its marker, so the race is not reachable in practice) and recorded here rather than changed in a content slice | first boot against an empty database |
| Careers | ~~`/careers` doesn't exist here~~ **Resolved 2026-10-14 (C)**: the reference's `/careers` page is transcribed, and contact's "Work With Us" now links to it instead of the company LinkedIn profile | contact, careers |
| Featured flag | No `featured` flag in the API → home uses honest newest-first slices (page 1 / page 2) | home |
| RFQ/call stats | No aggregation endpoint → stats band shows Products/Suppliers/Departments/Categories | home stats |
| Deep-category perma links | Raw slugs typed without `%2F` (e.g. `/categories/flooring/floor-carpets`) hit the 404 catch-all; app-generated links are always encoded | any deep category |
| Preexisting: auth 401s | `GET /api/v1/auth/session` returns 401 for anonymous browsers — documented, expected behavior of the session provider (client-only cookie read); spams the dev console | everywhere |
| SSR read rate-limit partition | The API rate-limits anonymous reads (`public.api`, **300/min**) per `ip:` partition; SSR reads carry no end-user identity, so **all** catalogue reads from the frontend server share one partition (and there is no `UseForwardedHeaders`, so behind a proxy they'd share the proxy IP). A real user is nowhere near 300/min, but the e2e's 84-navigation burst exceeds it (observed: ~12 × 429 when runs share a minute; 0 in a clean run). B14 contains the shell + home reads so a 429 no longer white-screens those; **page-level reads on the other catalogue/editorial routes are not yet contained** and would still surface the route error boundary if a 429 landed on them. Fix (not applied — needs deployment topology): enable `ForwardedHeaders` with a `KnownProxies`/`KnownNetworks` allow-list and have the frontend forward the visitor IP, or give the internal SSR client its own budget/identity | e2e burst; production under load |
| Gate precondition: credential rate limits | The credential budgets are real product behavior (`auth.register` **5/hour/IP**, `auth.login` **10/5min**, …) and the limiter is **in-memory per process**. One full e2e run consumes **3** registrations (rfq §11, responsive §158, smoke §77 — each spec needs its own account), so a second full run inside the same hour exhausts the budget and `smoke`'s UI registration correctly gets `429` and stays on `/register`. The API must therefore be **restarted between full runs** (`429` in `api-run*.log` is the signature). The backend's own integration host relaxes exactly these credential budgets under `ASPNETCORE_ENVIRONMENT=Testing` (`RateLimitPolicies.RelaxedUnderTesting`) and proves the 429 mechanics over HTTP with the test-only `test.tight` policy; these browser specs deliberately run against a normally-configured API so the real budgets stay in the loop | e2e repeat runs |

## Structure index
- `src/lib/navigation/navigation.ts` — departments, `MOST_SEARCHED`, `FOOTER_GROUPS`, hub/utility/
  mobile-quick links, `categoryHref()`, icons.
- `src/components/layout/nav/*` — department-menu, mobile-menu (drawer), mobile-dock, command-search, lazy-nav islands.
- `src/components/layout/site-header.tsx`, `site-footer.tsx`, `breadcrumbs.tsx`.
- `src/components/pages/info-page.tsx`, `user-guide-shell.tsx` (guide contents column + Prev/Next),
  `prose-sections.tsx` (reference section shape).
- `src/components/home/*` — hero-banner, stats-band, most-searched, product-grid-section,
  newest-suppliers-section, become-supplier-band, supplier-story-strip (reused).
- `src/app/[locale]/(public)/*` — home page, `/rfq`, the original editorial pages, and the 15 gap-C
  transcriptions (`user-guide` + 7 sub-pages, `how-it-works-for-buyers`, `careers`, `return-policy`,
  `data-deletion-instructions`, `privacy-policy-cookie-restriction-mode`, `conversion-tables`,
  `newest-products`).
- `src/lib/content/product-specifications.json` — the 28 spec tables for
  `/user-guide-product-specifications` (source URL + capture date inside).
- `src/app/[locale]/(public)/news/**` — the reference's editorial tree (api.md §2.12): the index
  (`page.tsx`, 6 a page, full bodies) plus `post/[slug]`, `category/[slug]` and `tag/[slug]`.
- `src/components/news/{article-card,article-body,news-shell}.tsx` — the list card, the transcribed-body
  renderer, and the multi-crumb shell (`InfoPage` carries one crumb; news needs Home / News / …).
- `src/lib/html/sanitize-article-html.ts` + `src/components/ui/sanitized-html.tsx` — the allow-list
  verifier and the single audited HTML renderer it guards (security-test-matrix I8/X11); the eslint rule
  is scoped off for that one file. `tests/e2e/sanitized-html.spec.ts` is its selftest.
- `src/lib/api/content.ts` + `content-server.ts` + `server.ts` — content DTOs, the SSR reads
  (`getArticles`, `getArticle`, `getContentCategories`) and the shared server transport with its retry
  budget, now used by the catalogue readers too.
- `src/lib/date.ts` — `formatPublishedDate` (one locale-aware date format for the surface, UTC on the wire).
- `backend/src/Stockpile.Api/Persistence/ContentSeeder.cs` (the single-writer seed),
  `src/Stockpile.Infrastructure/Persistence/ContentStore.cs` (EF reads, tri-state filters, locale
  fallback), `src/Stockpile.Application/Content/ContentService.cs` (the read service), plus
  `tools/content-migrate/` — the dataset builder (`content-dataset.mjs` → `out/articles.json`) and
  `reset-content.sql`, which clears the five content tables and the marker.
- `tests/ref-content/news/` — the harvested reference tree the migration was written from (index pages,
  4 bucket pages, 71 posts + the probe's post-page markup capture).
- `src/app/sitemap/sitemap.xml/route.ts` — the XML sitemap route handler (the reference's footer
  target); `src/app/[locale]/(public)/sitemap/page.tsx` is our HTML sitemap.
- `src/lib/reference-icons.ts` + `src/components/ui/reference-icon.tsx` — the reference's 22 `mbi-*`
  glyphs (Font Awesome Free 6.7.2 source, licence header in the generated file) and the component that
  draws them; `tests/gen-reference-icons.mjs` regenerates the set.
- `src/app/globals.css` — `home-product-grid` (six across from 1200px) and `department-block` (300px
  from 1200px): both are utilities because Tailwind v4 emits arbitrary `min-[1200px]:` variants before
  the named `lg:` ones, which silently defeats a `lg:* min-[1200px]:*` chain.
- `tests/ref-content/` — the captured reference copy the transcriptions were written from (EN + SI,
  HTML + text, plus `spec-tables.json`).
- `src/app/[locale]/(auth)/supplier-register|supplier-login/page.tsx` — supplier onboarding + supplier-framed sign-in.
- `src/components/procurement/rfq-form.tsx` — RFQ client form (session-gated prompt, capability pre-emption, two-call submit + recent-requests list).
- `src/components/auth/supplier-register-form.tsx` — supplier onboarding form (single atomic submit).
- `src/app/[locale]/(workspace)/wizard/{profile,organization,preferences,notification-preferences}/page.tsx` — the four buyer setup steps (residual #4b); each is an async server component, and `/workspace`'s "Account setup" card links into the first.
- `src/components/auth/{wizard-shell,profile-form,organization-form,preferences-form,notification-preferences-form}.tsx` — the shared stepper plus the four step forms. Every read-then-fill form is inert (`aria-busy`, fields disabled) until its own read settles — the race residual #4b documents.
- `src/lib/geography.ts` — the 9 provinces / 25 districts transcribed from `DbSeeder`; the province is derived from the district, never typed.
- `src/lib/api/organizations.ts` — `POST /organizations` for wizard step 2.
- `src/app/globals.css` → `label-wrap` — the one **unlayered** rule: a translated button label may wrap (residual #4b).
- Backend (for cross-reference): `src/Stockpile.Application/Procurement/RfqService.cs`, `src/Stockpile.Application/Authentication/…` supplier register, migration `20261013175104_RfqProcurement`.
- Backend (residual #4b): `src/Stockpile.Contracts/Authentication/MeResponses.cs`, `src/Stockpile.Application/Authentication/UserProfile{Service,Validators}.cs`, `src/Stockpile.Infrastructure/Persistence/Stores/UserProfileStore.cs`, `src/Stockpile.Api/Controllers/MeController.cs` (the six wizard endpoints).
- `src/messages/en.json` / `si.json` — all copy, `pages.*` namespace for editorial pages.
- `public/original/` — reference assets with provenance README.