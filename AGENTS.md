# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Next.js running shoes store with Supabase-backed accounts, favorites, and orders. Storefront data loading starts in `app/page.tsx`; the interactive catalog, basket, and checkout behavior live in `components/storefront.tsx`. Account routes live under `app/account/`; auth routes live under `app/login`, `app/register`, and `app/auth/callback`. Server actions are grouped in `app/actions/`. Supabase client helpers live in `lib/supabase/`, domain types in `lib/types.ts`, data loaders in `lib/data.ts`, and database migrations in `supabase/migrations/`.

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

Keep persisted account, favorite, and order mutations in server actions. Use `lib/supabase/server.ts` for server components/actions and `lib/supabase/browser.ts` only from client components that truly need direct Supabase browser access. Update `supabase/migrations/` whenever database tables, RLS policies, RPC functions, or seed product requirements change. Do not bypass RLS assumptions in UI code; pages should work with owner-scoped reads and writes.

OAuth providers are configured outside the codebase in Supabase and the provider dashboards. For local development, Supabase URL Configuration must include Site URL `http://localhost:3000` and Redirect URL `http://localhost:3000/auth/callback`. Provider dashboards, such as Google Cloud Console, should use the Supabase provider callback URL shown in Supabase, not the app callback URL.

## Testing Guidelines

No automated test framework is configured yet. Validate changes with `npm run lint`, `npm run build`, and browser checks at desktop and mobile widths. For auth changes, verify email registration, Google registration when configured, username login, and password policy enforcement: 8+ characters, one uppercase letter, one number, and one special character. For cart and order changes, verify adding items updates quantity, line totals, total price, checkout redirects signed-out users, signed-in checkout creates an order, and cancel buttons only appear for pending/processing orders. If tests are added later, place them under `tests/` or beside the relevant component using names such as `orders.test.tsx`.

## Commit & Pull Request Guidelines

This directory is not currently initialized as a Git repository, so no local commit history is available. Use short, imperative commit subjects, optionally scoped, such as `feat: add account orders` or `docs: update supabase setup`. Pull requests should include a concise summary, validation commands run, linked issues when available, and screenshots for UI changes.

## Agent-Specific Instructions

Inspect the current app before editing. Keep changes scoped to the running shoes storefront requirements: dark design, orange accents, responsive layout, catalog cards, auth/account flows, favorites, and client-side basket behavior. Update this guide and `README.md` whenever project commands, structure, dependencies, database schema, or requirements change.

# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
