# Product Detail Pages

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows `.agent/PLANS.md` in this repository.

## Purpose / Big Picture

StrideForge currently lets shoppers browse compact catalog cards, but there is no page for deeper product evaluation. After this change, a shopper can open `/products/1`, inspect a larger image, sizing guidance, technical specs, fit notes, and stock status, then save the shoe or add it to the basket. Catalog editors can maintain this detail content in Supabase from the admin catalog page.

## Progress

- [x] (2026-06-23) Inspected existing storefront, cart, favorites, admin catalog, Supabase migrations, and product data loading.
- [x] (2026-06-23) Decided to persist detail fields in Supabase and disable add-to-basket for inventory `0`.
- [x] (2026-06-23) Add product detail columns and seed backfills in a Supabase migration.
- [x] (2026-06-23) Extend product types, fallback catalog data, data loaders, and cart storage compatibility.
- [x] (2026-06-23) Add the public `/products/[id]` route and client detail component.
- [x] (2026-06-23) Update storefront and favorites product surfaces with detail links and out-of-stock handling.
- [x] (2026-06-23) Update admin catalog forms/actions so detail fields are editable.
- [x] (2026-06-23) Update README and AGENTS documentation.
- [x] (2026-06-23) Run lint/build and route/screenshot verification.

## Surprises & Discoveries

- Observation: Cart localStorage currently sanitizes a small product shape.
  Evidence: `lib/cart-storage.ts` reconstructs cart items from `id`, `name`, `description`, `price`, `imageUrl`, `inventory`, and `status`, so adding required product fields must keep existing stored carts readable.

- Observation: The local Supabase database had not applied the new detail migration during browser verification.
  Evidence: `/products/1` returned 404 until `getProductById()` mirrored the storefront loader's fallback behavior for Supabase query errors.

- Observation: The bundled Node REPL Playwright package expected browser binaries that were not installed, and the matching bundled install command hung without output.
  Evidence: REPL launch failed with a missing Chromium headless shell path, while `npx playwright screenshot` succeeded for desktop and mobile screenshots.

## Decision Log

- Decision: Add first-class `products` columns for sizing info, fit notes, and JSON specs.
  Rationale: Detail content must be persistent and admin-editable, not hard-coded only in the UI.
  Date/Author: 2026-06-23 / Codex

- Decision: Treat `inventory === 0` as out of stock and disable add-to-basket on product surfaces.
  Rationale: The requested stock status should prevent shoppers from adding unavailable products.
  Date/Author: 2026-06-23 / Codex

- Decision: Keep `/products/[id]` numeric and return not found for invalid, missing, or archived products.
  Rationale: The current catalog uses numeric ids and active-product public policies.
  Date/Author: 2026-06-23 / Codex

- Decision: Fall back to seeded product details when Supabase product detail selection errors.
  Rationale: This preserves the existing storefront behavior when Supabase is unavailable or migrations have not been applied, while still returning not found for successful missing/archived lookups.
  Date/Author: 2026-06-23 / Codex

## Outcomes & Retrospective

Implemented product detail pages, persisted detail fields, admin authoring support, and out-of-stock add-to-basket guards across product surfaces. Lint and production build passed. Route status and rendered body content were verified with local HTTP checks, and desktop/mobile screenshots were captured. Full Playwright interaction assertions were not completed because the REPL browser binary was unavailable, but the working `npx playwright screenshot` path verified rendered layouts.

## Context and Orientation

The storefront route starts in `app/page.tsx`, loads products with `getProducts()` from `lib/data.ts`, and renders `components/storefront.tsx`. Cart state is client-side localStorage managed by `lib/cart-storage.ts`. Favorites are persisted with the `toggleFavorite` server action in `app/actions/favorites.ts`. Catalog authoring lives in `components/admin-forms.tsx` and `app/actions/catalog.ts`. Supabase schema migrations live in `supabase/migrations/`.

## Plan of Work

Add a new migration that augments `public.products` with `sizing_info`, `fit_notes`, and `specs`. Backfill the existing seeded shoes with realistic running-shoe details. Keep the columns public under the existing active-product select policy because they are part of public product merchandising.

Update the TypeScript `Product` model and all product mapping code. `specs` will be an array of `{ label: string; value: string }`. `getProducts()`, `getFavoriteProducts()`, and `getAdminProducts()` must select the new fields. Add `getProductById(id)` for the detail route, returning only active products and falling back to seeded products when Supabase is not configured.

Create a client product detail component that receives one product plus session favorite state. It should use the same localStorage cart helpers and favorite action as the storefront. The server page `app/products/[id]/page.tsx` parses the numeric id, calls `getProductById()`, fetches session context, renders the normal header/setup notice, and calls `notFound()` when appropriate.

Update existing product surfaces so catalog cards and favorites link to detail pages, show stock status, and disable add-to-basket for out-of-stock products. Update admin create/edit forms and actions to validate, parse, persist, and revalidate detail fields.

Update documentation to mention product detail pages, the new schema migration, admin fields, and validation cases.

## Concrete Steps

Run all commands from `/Users/ivalex/projects/codex_project1`.

1. Added the migration, type/data changes, UI components, and documentation edits.
2. Ran `npm run lint`; ESLint completed with no errors.
3. Ran `npm run build`; Next.js compiled successfully and listed `/products/[id]`.
4. Started `npm run dev`; verified `/products/1` returns 200, `/products/not-a-number` returns 404, and the rendered body contains the expected detail sections.
5. Captured desktop and mobile screenshots with `npx playwright screenshot`.

## Validation and Acceptance

The feature is accepted when `/products/1` renders a full detail page with large image, sizing info, specs, fit notes, stock status, favorite toggle, and add-to-basket; `/products/not-a-number` and inactive products return not found; adding from the detail page updates `/cart`; signed-out favorite clicks redirect to `/login?redirectTo=/products/1`; and inventory `0` products cannot be added from storefront, detail, or favorites.

## Idempotence and Recovery

The migration uses additive columns and id-based updates, so rerunning it should not duplicate data. If validation fails after UI edits, use TypeScript and lint errors to identify the affected file and update this plan before continuing.

## Artifacts and Notes

Validation transcripts:

    npm run lint
    > running-shoes-store@0.1.0 lint
    > eslint .

    npm run build
    ✓ Compiled successfully
    Route (app)
    ├ ƒ /products/[id]

    node -e local body check
    {"status":200,"hasName":true,"hasSizing":true,"hasFit":true,"hasSpecs":true,"hasStock":true,"length":19160}

    curl -I http://127.0.0.1:3000/products/not-a-number
    HTTP/1.1 404 Not Found

Screenshot artifacts:

    /tmp/product-detail-page.png
    /tmp/product-detail-mobile.png

## Interfaces and Dependencies

`Product` must include `sizingInfo: string`, `fitNotes: string`, and `specs: ProductSpec[]`. `ProductSpec` must include `label: string` and `value: string`. `getProductById(id: number): Promise<Product | null>` must be exported from `lib/data.ts`.
