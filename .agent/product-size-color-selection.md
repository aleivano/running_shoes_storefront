# Product Size and Color Selection

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows `.agent/PLANS.md` from the repository root.

## Purpose / Big Picture

Shoppers must choose a size and color for a running shoe before it enters the cart, because those choices are part of the product they are buying. Catalog cards should stay browse-focused and show color availability without allowing an incomplete cart item. Admins and catalog editors should configure the sizes and colors when creating or editing products, while inventory remains one count for the whole model.

## Progress

- [x] (2026-06-23T20:29:54Z) Inspected the existing product, cart, checkout, admin, and migration structure.
- [x] (2026-06-23T20:37:09Z) Add product and order variant fields to domain types, fallback data, Supabase migration, and data mappers.
- [x] (2026-06-23T20:37:09Z) Update admin product forms and server action validation for size and color authoring.
- [x] (2026-06-23T20:37:09Z) Update product detail, storefront, favorites, cart, checkout, and order history behavior.
- [x] (2026-06-23T20:37:09Z) Update README and AGENTS guidance for the new variant workflow.
- [x] (2026-06-23T20:37:09Z) Run lint, build, and browser smoke validation.

## Surprises & Discoveries

- Observation: The current cart stores full product snapshots and groups cart lines only by product id.
  Evidence: `lib/cart-storage.ts` defines `CartItem = Product & { quantity }` behavior through `addProductToCart(cart, product)`.
- Observation: Checkout currently groups quantities by product id before order creation.
  Evidence: `app/actions/orders.ts` builds `const quantities = new Map<number, number>()`.
- Observation: The repo does not have Playwright in local `node_modules`, and sandboxed Chromium launch was blocked by macOS permissions.
  Evidence: the first smoke attempt failed with `Cannot find module 'playwright'`; the second failed with `bootstrap_check_in ... Permission denied`; the approved run against the existing dev server passed.

## Decision Log

- Decision: Keep inventory model-level and validate only total product quantity during checkout.
  Rationale: The requested plan explicitly selected model-level inventory, so sizes and colors are required product selections but not separate stock ledgers.
  Date/Author: 2026-06-23 / Codex
- Decision: Persist selected size and color as snapshot fields on `order_items`.
  Rationale: Order history must remain accurate even if admins later rename or remove a color from the catalog product.
  Date/Author: 2026-06-23 / Codex

## Outcomes & Retrospective

Implemented product size/color options across admin authoring, public catalog, product detail, cart, checkout, and order history. Lint, production build, and a browser smoke test passed. The browser smoke verified the catalog has no add-to-basket text, swatches render, product detail requires options before adding, and two variants of the same product create two cart lines.

## Context and Orientation

The storefront starts in `app/page.tsx`, which loads products through `lib/data.ts` and renders `components/storefront.tsx`. Product details are rendered by `app/products/[id]/page.tsx` and `components/product-detail.tsx`. Cart state is stored in browser local storage by `lib/cart-storage.ts`, then `components/cart-page.tsx` refreshes line prices and status from current product data before checkout. Checkout is completed by `app/actions/orders.ts`, which creates rows in `orders` and `order_items`. Admin catalog authoring uses `components/admin-forms.tsx` and `app/actions/catalog.ts`.

## Plan of Work

First extend the data model with product-level arrays for sizes and colors, plus order-item selected variant snapshot columns. Add a migration that is safe to rerun by using `add column if not exists` and constraint existence checks. Update fallback products so the app still works without Supabase configuration.

Next update server-side parsing and mapping. `lib/types.ts` will define `ProductColor`, product size/color fields, and cart selected variant fields. `lib/data.ts` will select and map those columns. `app/actions/catalog.ts` will parse sizes from comma or newline-separated text and colors from `Name: #RRGGBB` lines.

Then update client behavior. The storefront will remove direct add-to-cart and show a single-row responsive color swatch strip. The product detail page will require a size and color before adding a variant-specific cart line. Cart quantity controls will use a stable line key based on product id, selected size, and selected color. Checkout will validate that selected values still exist on the active product and store the selected values on order items.

Finally update documentation and validate with lint, build, and a browser smoke test against the local dev server.

## Concrete Steps

Run all commands from `/Users/ivalex/projects/codex_project1`.

Use targeted patches for source files, then run:

    npm run lint
    npm run build
    npm run dev

When the dev server is running, verify `http://localhost:3000`, `http://localhost:3000/products/1`, and `http://localhost:3000/cart`.

Completed validation commands:

    npm run lint
    npm run build

The browser smoke test used the existing dev server on port 3000 and wrote a screenshot to `/tmp/product-variants-smoke.png`.

## Validation and Acceptance

Acceptance is met when the public catalog hides zero-inventory products, catalog cards have no add-to-basket button, color swatches render in one responsive row, product details require size and color before adding to cart, the same product can appear as separate cart lines for separate variants, checkout preserves size and color on order history, and admin catalog forms validate and save sizes and colors.

`npm run lint` and `npm run build` must complete successfully.

## Idempotence and Recovery

The migration must use additive columns and guarded constraints so it can be applied once to an existing database without disrupting current rows. Existing local storage carts without variant fields should be sanitized out rather than producing invalid incomplete checkout lines. If a browser cart contains a product whose selected size or color is no longer configured, the cart page should drop that line from the checkout-ready view.

## Artifacts and Notes

Validation evidence:

    npm run lint
    > running-shoes-store@0.1.0 lint
    > eslint .

    npm run build
    ✓ Compiled successfully
    Finished TypeScript
    ✓ Generating static pages

    variant smoke passed: /tmp/product-variants-smoke.png

## Interfaces and Dependencies

No new npm packages are required. The implementation uses React, Next.js, Tailwind CSS, and Supabase APIs already present in the project.

At completion, `Product` includes `availableSizes` and `availableColors`, `CartItem` includes `selectedSize` and `selectedColor`, and order items include selected variant snapshot fields.
