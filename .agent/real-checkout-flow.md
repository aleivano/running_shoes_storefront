# Add a real cart checkout flow

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root.

## Purpose / Big Picture

After this change, a shopper can add shoes from the storefront, see a compact Cart control with an item count, open `/cart`, and complete a realistic checkout instead of creating an unpaid placeholder order. The shopper enters a US shipping address, chooses a delivery speed, sees tax and shipping totals, and pays with a fake test card. A successful fake payment creates a paid processing order that appears in account order history with delivery and payment details; a declined or invalid fake card shows an error and does not create an unpaid order.

The observable behavior is that card `4242 4242 4242 4242` succeeds with any valid future expiration and three-digit CVC, card `4000 0000 0000 9995` declines, and other card numbers are rejected. Full card numbers are never stored.

## Progress

- [x] (2026-06-23 00:00Z) Read `.agent/PLANS.md`, `AGENTS.md`, and the current order, storefront, data loader, and migration code.
- [x] (2026-06-23 00:00Z) Created this ExecPlan before implementation.
- [x] (2026-06-23 18:00Z) Add shared checkout calculation, address validation, delivery option, and mock payment types.
- [x] (2026-06-23 18:00Z) Replace placeholder order creation with an authoritative paid checkout server action.
- [x] (2026-06-23 18:00Z) Extend the storefront basket into an inline checkout form with address, delivery, totals, and fake card inputs.
- [x] (2026-06-23 19:00Z) Move checkout from the storefront sidebar into a dedicated `/cart` route and keep only a compact Cart control on the storefront.
- [x] (2026-06-23 18:00Z) Extend order history and data mapping to show checkout metadata.
- [x] (2026-06-23 18:00Z) Add an additive Supabase migration for delivery and payment metadata.
- [x] (2026-06-23 18:00Z) Update documentation for the real checkout flow and new migration.
- [x] (2026-06-23 18:00Z) Run lint, production build, and browser checks at desktop and mobile widths.

## Surprises & Discoveries

- Observation: The initial orders table already has `shipping_total`, `tax_total`, `payment_status`, and `shipping_address`, but checkout hard-codes free shipping, zero tax, unpaid payment, and an empty address.
  Evidence: `app/actions/orders.ts` inserts `shipping_total: 0`, `tax_total: 0`, `payment_status: "unpaid"`, and `shipping_address: {}`.
- Observation: Prices are stored and formatted as whole-dollar integer values, not cents.
  Evidence: seed products use values such as `129`, and `lib/format.ts` formats without fractional digits.
- Observation: The dedicated `agent-browser` CLI was not installed, and the bundled Playwright package could not launch Chromium inside the sandbox.
  Evidence: `agent-browser open http://localhost:3000` returned `command not found`; a sandboxed Playwright launch failed with a macOS MachPort permission error. Installing Chromium with `npx playwright install chromium` and running the smoke script outside the sandbox completed the browser verification.

## Decision Log

- Decision: Use a local mock payment processor for v1 instead of installing Stripe packages.
  Rationale: The requested testing flow needs a fake credit card and should work without external accounts, API keys, webhooks, or network access. The code will keep payment validation behind a small function so a future Stripe implementation can replace it.
  Date/Author: 2026-06-23 / Codex
- Decision: Keep checkout inline in `components/storefront.tsx`.
  Rationale: The current app already has a sticky basket and client-side cart state there. Extending that surface avoids adding cart persistence or a new route just to carry cart state.
  Date/Author: 2026-06-23 / Codex
- Decision: Move checkout to `/cart` and persist the client cart in `localStorage`.
  Rationale: The user found the desktop storefront basket layout too heavy and requested that the front page show only a Cart control with an item count. Local storage keeps the cart available after clicking through to the dedicated cart page.
  Date/Author: 2026-06-23 / Codex
- Decision: Use simple US-only fixed rates: standard shipping is $8 or free at $150 subtotal, express shipping is $18, and tax is 8.25% on subtotal plus shipping rounded to the nearest whole dollar.
  Rationale: These rules are deterministic, easy to verify manually, and match the current whole-dollar schema.
  Date/Author: 2026-06-23 / Codex
- Decision: Create orders only after mock payment succeeds.
  Rationale: The user specifically called out unpaid orders as the missing ecommerce piece. Failed or declined fake payments should leave no order record instead of creating unpaid order history noise.
  Date/Author: 2026-06-23 / Codex

## Outcomes & Retrospective

The real checkout flow is implemented. The storefront now shows a compact Cart control with an item count; `/cart` collects shipping address, delivery option, and fake card details; the server validates and recalculates the checkout before inserting a paid processing order; order history displays delivery and masked payment metadata; and documentation describes the new migration and fake cards. Automated lint/build validation passed. Browser smoke checks covered anonymous desktop redirect and mobile checkout rendering. Full paid-order creation still requires a configured Supabase session in a browser, so it remains a manual authenticated verification step for the user’s local Supabase environment.

## Context and Orientation

This repository is a Next.js running shoes storefront. `app/page.tsx` loads products and session data, then renders `components/storefront.tsx`, which is the client component that owns catalog interactions, favorites, and the compact Cart control. `app/cart/page.tsx` renders `components/cart-page.tsx`, which owns cart contents and checkout. Order mutations live in `app/actions/orders.ts` as server actions, which means the code runs on the server and can safely talk to Supabase. Shared domain types live in `lib/types.ts`, client cart storage helpers live in `lib/cart-storage.ts`, row-to-domain mapping and order loading live in `lib/data.ts`, and database schema migrations live in `supabase/migrations/`.

Supabase row level security, abbreviated RLS, means the database enforces which rows a signed-in user may read or write. Existing order policies let a shopper insert and read only their own orders and order items. This feature must keep order writes inside server actions and must not bypass those owner-scoped policies.

The current database stores product prices as whole-dollar integers. All checkout totals in this feature use the same integer-dollar model so they fit the existing schema without a money-unit migration.

## Plan of Work

First, add shared checkout logic in a new `lib/checkout.ts` module. It will define delivery options, the default shipping address and payment form shape, validation helpers, `calculateCheckoutTotals`, and `processMockPayment`. The client will use it for immediate total preview, and the server action will use it for authoritative validation and calculation.

Second, extend `lib/types.ts` and `lib/data.ts` so orders include `deliveryOption`, `paymentProvider`, `paymentReference`, and a JSON `paymentMethod` summary. The order query in `getOrders()` must select these new columns so `/account/orders` can render them.

Third, update `app/actions/orders.ts`. Replace the old `createOrderFromCart(cart)` flow with a checkout action that accepts cart items, shipping address, delivery option, and fake payment input. The action must require Supabase configuration and an authenticated user, validate the cart, load active products from Supabase, reject missing or insufficient inventory, recompute subtotal and totals from database prices, validate the address and delivery option, run the mock payment processor, and only then insert the order, order items, and order event. On success, insert `status = "processing"`, `payment_status = "paid"`, `payment_provider = "mock"`, a generated mock payment reference, and a masked payment method JSON object. On validation or decline, return an error without inserting an order.

Fourth, update `components/storefront.tsx`, add `lib/cart-storage.ts`, and add `components/cart-page.tsx` plus `app/cart/page.tsx`. The storefront will show only a compact Cart control with an icon and count, backed by `localStorage`. The cart page will show cart items, address fields, delivery radio buttons, an order summary with subtotal, shipping, tax, and total, fake card fields, and helper copy for success and decline test cards. The submit button will call the new server action and clear the cart only after success. Signed-out shoppers still redirect to `/login?redirectTo=/cart`.

Fifth, update `app/account/orders/page.tsx` to show the richer checkout metadata: subtotal, shipping, tax, total, delivery option, destination city/state/ZIP, and masked card brand/last four when present. Keep the existing cancellation behavior for pending and processing orders.

Sixth, add an additive migration after the admin migration. It will add `delivery_option`, `payment_provider`, `payment_reference`, and `payment_method` columns to `public.orders` with safe defaults. Existing orders remain readable, with standard/mock defaults and an empty payment method.

Finally, update `README.md` and `AGENTS.md` to document real checkout behavior, fake card numbers, validation expectations, and the new migration. Run validation commands and record the result in this ExecPlan.

## Concrete Steps

Run all commands from `/Users/ivalex/projects/codex_project1`.

Create and edit files as described in the Plan of Work. After implementation, run:

    npm run lint
    npm run build

If a local Supabase database is being used, run migrations in order:

    supabase/migrations/20260622000000_accounts_orders_favorites.sql
    supabase/migrations/20260623000000_admin_roles_catalog_authoring.sql
    supabase/migrations/20260624000000_checkout_metadata.sql

Start the local app for browser verification:

    npm run dev

Then open `http://localhost:3000`, add shoes to the cart, open `/cart`, and test checkout while signed in.

## Validation and Acceptance

Run `npm run lint` and expect ESLint to complete without errors. Run `npm run build` and expect a production build to complete.

For manual browser validation, verify these scenarios. The storefront shows only a Cart control with an item count, adding products increments that count, and clicking Cart opens `/cart`. A signed-out shopper with items in the cart who clicks the checkout button is sent to `/login?redirectTo=/cart`. A signed-in shopper cannot submit with an empty cart, missing required address fields, invalid state, invalid ZIP, invalid delivery option, expired card, bad CVC, or unsupported card. A signed-in shopper using card `4242 4242 4242 4242`, any valid future date, and any three-digit CVC creates a paid processing order and lands on `/account/orders?created=<id>`. A signed-in shopper using card `4000 0000 0000 9995` sees a decline error and no new order appears. Standard shipping is free when subtotal is at least `$150`, otherwise `$8`; express shipping is always `$18`. The account orders page shows paid status, delivery option, address summary, masked payment method, subtotal, shipping, tax, and total. Cancel remains available for processing orders.

Validation completed during implementation:

    npm run lint
    Result: passed.

    npm run build
    Result: passed. Next.js compiled, TypeScript completed, and 12 app routes generated.

    npm run dev
    Result: dev server started on http://localhost:3000.

    curl -I http://localhost:3000
    Result: HTTP/1.1 200 OK.

    npx playwright screenshot --browser=chromium http://localhost:3000 /tmp/checkout-home.png
    Result: screenshot captured.

    NODE_PATH=/Users/ivalex/.npm/_npx/e41f203b7505f1fb/node_modules node /private/tmp/checkout-smoke.js
    Result: checkout smoke passed.

## Idempotence and Recovery

The migration is additive and uses `add column if not exists`, so it can be applied to an existing database without deleting order data. If a checkout fails validation or payment decline, no order should be created and the shopper can correct the form and retry. If order item insertion fails after order creation, the server action must return an error; this is not expected in normal RLS-backed operation, and the implementation should keep order and item inserts adjacent so the failure is easy to diagnose.

No real payment processor keys, full card numbers, or external API calls are introduced by this plan.

## Artifacts and Notes

Key validation transcript:

    > running-shoes-store@0.1.0 lint
    > eslint .

    > running-shoes-store@0.1.0 build
    > next build
    ✓ Compiled successfully
    Finished TypeScript
    ✓ Generating static pages using 13 workers (12/12)

    HTTP/1.1 200 OK
    http://localhost:3000

    checkout smoke passed

## Interfaces and Dependencies

In `lib/checkout.ts`, define and export:

    export type DeliveryOptionId = "standard" | "express";
    export type CheckoutAddress = { name: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: "US"; phone: string; };
    export type MockPaymentInput = { cardholderName: string; cardNumber: string; expiration: string; cvc: string; };
    export function calculateCheckoutTotals(subtotal: number, deliveryOption: DeliveryOptionId): CheckoutTotals;
    export function validateCheckoutAddress(address: CheckoutAddress): CheckoutAddressValidationResult;
    export function processMockPayment(payment: MockPaymentInput): MockPaymentResult;

In `app/actions/orders.ts`, expose:

    export async function createPaidOrderFromCheckout(input: CheckoutOrderInput): Promise<CreateOrderResult>

The old `createOrderFromCart` call site in `components/storefront.tsx` must be replaced with the new checkout action.

Revision note 2026-06-23: Initial ExecPlan created before implementation to make the real checkout feature self-contained and auditable.

Revision note 2026-06-23: Updated progress, validation evidence, and outcomes after implementing shared checkout rules, server-side paid order creation, inline checkout UI, order history metadata, migration, and documentation.

Revision note 2026-06-23: Updated the plan after the user requested a compact storefront Cart control and dedicated cart page instead of showing the full checkout on the storefront.
