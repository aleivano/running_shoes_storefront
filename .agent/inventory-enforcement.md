# Inventory Enforcement

This ExecPlan is a living document. It must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this change, shoppers cannot pay for more shoes than are available, successful paid orders reduce inventory, and shoppers see low-stock or out-of-stock signals based on a per-product admin threshold. The feature is visible by setting a product's inventory and low-stock threshold in `/admin/catalog`, browsing the catalog and detail page, and completing checkout with a quantity that is within stock.

## Progress

- [x] (2026-06-23) Researched current product, admin, cart, checkout, and Supabase schema paths.
- [x] (2026-06-23) Wrote this ExecPlan before implementation.
- [x] (2026-06-23) Added schema, type, data-loader, and fallback support for low-stock thresholds and inventory decrementing.
- [x] (2026-06-23) Updated admin catalog forms and actions to edit low-stock thresholds.
- [x] (2026-06-23) Updated public stock labels and cart quantity enforcement.
- [x] (2026-06-23) Updated checkout to decrement inventory on paid order creation and revalidate affected pages.
- [x] (2026-06-23) Updated README for migration, admin, and validation coverage.
- [x] (2026-06-23) Ran lint and build validation.

## Surprises & Discoveries

- Observation: The app already checks checkout quantities against current Supabase product inventory before order creation, but it does not decrement stock after payment.
  Evidence: `app/actions/orders.ts` loads active products and returns an error when `product.inventory < quantity`.
- Observation: Public product lists previously hid products with zero inventory, but the new requirement needs out-of-stock catalog cards.
  Evidence: `getProducts()` now loads all active products; `getFavoriteProducts()` still filters to products with inventory greater than `0`.
- Observation: Cart lines can represent multiple size/color variants for the same product, but inventory is product-level.
  Evidence: `components/cart-page.tsx` now aggregates quantities by product id before allowing line increases or checkout.

## Decision Log

- Decision: Store the low-stock threshold on each product as `low_stock_threshold`, defaulting to `10`; `0` disables low-stock messaging.
  Rationale: The requirement says the number is configurable in the admin console for each item and that `0` means not to notify.
  Date/Author: 2026-06-23 / Codex
- Decision: Keep product-level inventory enforcement rather than inventing size/color-level stock.
  Rationale: The current schema has one `inventory` number per product and no per-variant stock model.
  Date/Author: 2026-06-23 / Codex
- Decision: Use a Supabase RPC function for inventory decrementing.
  Rationale: The update must happen in the database with a `where inventory >= quantity` guard so concurrent checkouts cannot oversell.
  Date/Author: 2026-06-23 / Codex
- Decision: Use a batch inventory decrement RPC for checkout.
  Rationale: A cart can contain multiple products, and all requested product quantities should decrement together or not at all.
  Date/Author: 2026-06-23 / Codex

## Outcomes & Retrospective

Implementation is complete. Lint and production build passed.

## Context and Orientation

Products are represented by `Product` in `lib/types.ts`, loaded from Supabase in `lib/data.ts`, and fallback seeded in `lib/catalog.ts` when Supabase is not configured. Admin product create/update forms live in `components/admin-forms.tsx` and submit to server actions in `app/actions/catalog.ts`. The storefront grid lives in `components/storefront.tsx`; product detail interaction lives in `components/product-detail.tsx`; cart checkout lives in `components/cart-page.tsx`; order creation and payment rules live in `app/actions/orders.ts`.

Inventory is currently a single integer on `products`, not a per-size or per-color quantity. A low-stock threshold is the integer cutoff configured by a catalog author. If threshold is `10`, low-stock text appears only when inventory is less than `10`. If threshold is `0`, low-stock text never appears. Out-of-stock is separate and still appears when a rendered product has inventory `0`.

## Plan of Work

Add a new migration under `supabase/migrations/` that adds `products.low_stock_threshold` and creates `decrement_product_inventory` plus `decrement_product_inventories`. The batch function takes a JSON array of product ids and quantities, confirms every active product has enough inventory, decrements all requested products, and returns whether the batch succeeded.

Update `lib/types.ts`, `lib/data.ts`, `lib/catalog.ts`, and `lib/cart-storage.ts` so every product has `lowStockThreshold`. Keep fallback products at threshold `10`.

Update admin product parsing and forms so catalog authors can set the threshold. Validate it as a whole number greater than or equal to `0`.

Replace hard-coded `10` stock display logic in storefront, product detail, and favorites with a helper that returns `Out of stock`, `low on stock: N`, or no low-stock message according to the threshold.

Update cart behavior so users cannot increase a line past current product inventory and checkout is disabled with a clear message if cart quantities exceed current stock. Keep server checkout authoritative by rechecking stock from Supabase and calling the decrement RPC after payment succeeds.

## Concrete Steps

Run commands from `/Users/ivalex/projects/codex_project1`.

1. Edit the files described above.
2. Run `npm run lint`.
3. Run `npm run build`.

## Validation and Acceptance

Acceptance requires `npm run lint` and `npm run build` to pass. In the browser, `/admin/catalog` must show a low-stock threshold field that accepts `0` and positive integers. A product with inventory below threshold must show `low on stock: N` on `/` and `/products/<id>`. A product above threshold must show no low-stock message. Threshold `0` must suppress low-stock messaging. Checkout with more units than available must fail without a paid order; checkout within stock must create a paid order and reduce inventory.

## Idempotence and Recovery

The migration is additive and uses `if not exists` for the column plus `create or replace function` for the RPC. Re-running product form updates is safe. Failed checkout decrement attempts return errors rather than making inventory negative.

## Artifacts and Notes

Validation passed:

    npm run lint
    > running-shoes-store@0.1.0 lint
    > eslint .

    npm run build
    > running-shoes-store@0.1.0 build
    > next build
    ✓ Compiled successfully
    ✓ Generating static pages using 13 workers (13/13)

## Interfaces and Dependencies

At completion, `Product` includes `lowStockThreshold: number`. The Supabase database includes `public.products.low_stock_threshold`, `public.decrement_product_inventory(p_product_id integer, p_quantity integer) returns boolean`, and `public.decrement_product_inventories(p_items jsonb) returns boolean`.
