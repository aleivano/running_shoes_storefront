# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Next.js running shoes store with Supabase-backed accounts, favorites, paid checkout orders, product detail pages, size/color product options, and admin catalog authoring. Storefront data loading starts in `app/page.tsx`; the interactive catalog and cart count live in `components/storefront.tsx`; product detail pages live at `app/products/[id]/page.tsx` with interactions in `components/product-detail.tsx`; cart and checkout behavior live in `components/cart-page.tsx` at `/cart`. Account routes live under `app/account/`; admin routes live under `app/admin/`; auth routes live under `app/login`, `app/register`, and `app/auth/callback`. Server actions are grouped in `app/actions/`. Supabase client helpers live in `lib/supabase/`, checkout rules in `lib/checkout.ts`, client cart storage in `lib/cart-storage.ts`, domain types in `lib/types.ts`, data loaders in `lib/data.ts`, and database migrations in `supabase/migrations/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server on `http://localhost:3000` using webpack.
- `npm run build`: create a production build and run TypeScript checks.
- `npm run start`: serve the production build after `npm run build`.
- `npm run lint`: run ESLint across the project.
- `npm audit --omit=dev`: check production dependencies for known vulnerabilities.

Use `npm install` after dependency changes to keep `package-lock.json` current. Copy `.env.local.example` to `.env.local`, set Supabase URL/anon key values, run the Supabase migration, configure Auth redirect URLs, and restart the dev server before testing authenticated flows.

## Coding Style & Naming Conventions

Use TypeScript, React function components, server components by default, and client components only where browser state or hooks are required. Use two-space indentation, descriptive component and variable names, and clear product/account copy. Prefer responsive Tailwind classes over custom media queries. Use `next/image` for remote product images and keep allowed image hosts in `next.config.mjs`.

## Supabase Guidelines

Keep persisted account, favorite, order, admin role, and catalog mutations in server actions. Use `lib/supabase/server.ts` for server components/actions and `lib/supabase/browser.ts` only from client components that truly need direct Supabase browser access. Update `supabase/migrations/` whenever database tables, RLS policies, RPC functions, role requirements, or seed product requirements change. Do not bypass RLS assumptions in UI code; pages should work with owner-scoped reads and writes plus role-scoped admin/catalog policies.

OAuth providers are configured outside the codebase in Supabase and the provider dashboards. For local development, Supabase URL Configuration must include Site URL `http://localhost:3000` and Redirect URLs `http://localhost:3000/auth/callback` and `http://localhost:3000/**`; otherwise auth flows can bounce from localhost to a deployed Vercel URL. Provider dashboards, such as Google Cloud Console, should use the Supabase provider callback URL shown in Supabase, not the app callback URL.

## Testing Guidelines

No automated test framework is configured yet. Validate changes with `npm run lint`, `npm run build`, and browser checks at desktop and mobile widths. For product detail changes, verify `/products/1` shows the large image, size picker, color picker, sizing info, specs, fit notes, stock status, favorite button, and add-to-basket; choosing a color with an image URL changes the large image; add-to-basket is disabled until size and color are selected; invalid ids and archived products return not found; and inventory `0` products are hidden from public catalog/favorites and cannot be purchased from detail pages. For storefront changes, verify catalog cards show responsive color swatches and no add-to-basket button. For auth changes, verify email registration, Google registration when configured, username login, and password policy enforcement: 8+ characters, one uppercase letter, one number, and one special character. For cart and order changes, verify adding size/color variants updates the storefront Cart count, `/cart` shows selected size/color per line, quantity controls update line totals, subtotal, shipping, tax, and total price; checkout redirects signed-out users; signed-in checkout requires a US shipping address, delivery option, and valid fake card; `4242 4242 4242 4242` creates a paid processing order with size/color shown in order history; `4000 0000 0000 9995` declines without creating an order; and cancel buttons only appear for pending/processing orders. For admin changes, verify customers cannot open `/admin`, admins can assign roles at `/admin/users`, and admins or catalog editors can create, update, activate, archive products, and edit sizes/colors/sizing/specs/fit notes at `/admin/catalog`. If tests are added later, place them under `tests/` or beside the relevant component using names such as `orders.test.tsx`.

## Commit & Pull Request Guidelines

This directory is not currently initialized as a Git repository, so no local commit history is available. Use short, imperative commit subjects, optionally scoped, such as `feat: add account orders` or `docs: update supabase setup`. Pull requests should include a concise summary, validation commands run, linked issues when available, and screenshots for UI changes.

## Agent-Specific Instructions

Inspect the current app before editing. Keep changes scoped to the running shoes storefront requirements: dark design, orange accents, responsive layout, catalog cards, size/color product selection, auth/account flows, favorites, and client-side cart behavior. Update this guide and `README.md` whenever project commands, structure, dependencies, database schema, or requirements change.

# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
