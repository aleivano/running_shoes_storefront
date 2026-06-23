# Add an admin console for user permissions and catalog authoring

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan follows `.agent/PLANS.md` from the repository root.

## Purpose / Big Picture

After this change, a store administrator can open an admin console, see registered users, assign roles, and give trusted users catalog authoring access. A user with catalog authoring access can create and edit running shoe catalog entries without direct database access. Regular customers keep the current shopping, favorites, account, and order behavior.

The observable behavior is that signed-in admins see an `Admin` link in the header and can visit `/admin/users` to change a user's role. Admins and catalog editors can visit `/admin/catalog` to create, update, activate, or archive products. Users without those permissions are redirected away from `/admin`.

## Progress

- [x] (2026-06-23 00:00Z) Read `.agent/PLANS.md` and inspected the existing auth, profile, product, account, and Supabase migration code.
- [x] (2026-06-23 00:00Z) Created this ExecPlan before implementation.
- [x] (2026-06-23 00:00Z) Add an additive Supabase migration for profile roles, permission helper functions, and RLS policies for admin and catalog author access.
- [x] (2026-06-23 00:00Z) Extend shared TypeScript types and data loaders so the app knows each signed-in user's role and can load admin user/product lists.
- [x] (2026-06-23 00:00Z) Add server actions for role assignment and product authoring, keeping writes on the server.
- [x] (2026-06-23 00:00Z) Add `/admin` routes and UI for users and catalog management.
- [x] (2026-06-23 00:00Z) Update header/account navigation and documentation.
- [x] (2026-06-23 00:00Z) Run validation commands and capture the outcome.
- [x] (2026-06-23 00:00Z) User verified the local admin/auth flow after adding localhost Supabase redirect configuration.

## Surprises & Discoveries

- Observation: The repo already had the ExecPlan template at `.agent/PLANS.md` after the directory rename, so this feature can use the documented path exactly.
  Evidence: `sed -n '1,240p' .agent/PLANS.md` showed the full ExecPlan requirements.
- Observation: The current database schema stores profiles but no role or permission field, and products are public-readable only when active.
  Evidence: `supabase/migrations/20260622000000_accounts_orders_favorites.sql` defines `public.profiles` without a role column and has only the `active products are public` product select policy.
- Observation: The first-admin bootstrap path needs to work from the Supabase SQL editor or another privileged database context where `auth.uid()` may be null.
  Evidence: The role-change trigger now allows `postgres`, `supabase_admin`, and `service_role` database roles while still rejecting ordinary non-admin role changes.
- Observation: The pre-existing Next dev server returned `TypeError: __webpack_modules__[moduleId] is not a function` for `/` until the generated `.next` cache was cleared.
  Evidence: `tail -180 .next/dev/logs/next-development.log` showed the webpack module error. After stopping the server, removing `.next`, and restarting `npm run dev`, `curl -I http://localhost:3000` returned `HTTP/1.1 200 OK`.
- Observation: Local auth can redirect to the deployed Vercel site if Supabase URL Configuration does not include both the localhost callback URL and a localhost wildcard URL.
  Evidence: The user reported the localhost flow redirected to Vercel, then confirmed it worked after updating configuration.

## Decision Log

- Decision: Use a role column on `public.profiles` with three roles: `customer`, `catalog_editor`, and `admin`.
  Rationale: The user asked for assigning different permissions for catalog authoring. A small role model is understandable, sufficient for the current app, and avoids adding a many-table permission system before there are multiple domains.
  Date/Author: 2026-06-23 / Codex
- Decision: Keep all permission-changing and catalog-authoring mutations in server actions.
  Rationale: `AGENTS.md` instructs persisted mutations to stay in server actions, and server actions pair cleanly with Supabase RLS checks.
  Date/Author: 2026-06-23 / Codex
- Decision: Implement an additive migration rather than editing the existing migration in place.
  Rationale: Existing deployments may already have run the first migration. An additive migration is safer and gives a clear upgrade path.
  Date/Author: 2026-06-23 / Codex
- Decision: Do not implement hard deletes for products in the admin UI; use `active` and `archived` status instead.
  Rationale: Orders and favorites can reference products. Archiving preserves history while removing items from the public storefront.
  Date/Author: 2026-06-23 / Codex

## Outcomes & Retrospective

The admin console implementation is complete. It adds database roles and catalog authoring policies, role-aware session data, server actions for role assignment and product authoring, protected `/admin` routes, navigation links, and documentation. Automated validation passed, and the user confirmed the local admin/auth flow works after Supabase localhost redirect configuration was corrected.

## Context and Orientation

This repository is a Next.js running shoes storefront. `app/page.tsx` loads products and session data, then renders `components/storefront.tsx`. Account pages live under `app/account/` and are protected by `app/account/layout.tsx`, which redirects signed-out users to `/login`. Auth and profile server actions live in `app/actions/auth.ts` and `app/actions/profile.ts`. Supabase server clients are created in `lib/supabase/server.ts`, and data loaders live in `lib/data.ts`.

The existing database migration `supabase/migrations/20260622000000_accounts_orders_favorites.sql` creates `profiles`, `products`, `favorites`, `orders`, `order_items`, and `order_events`. Supabase row level security, abbreviated RLS, means the database decides which rows the signed-in user may read or write. Existing policies let users read and update only their own profile, read active products, manage their own favorites, and manage their own orders.

For this plan, a role is a stored permission level on a profile. A `customer` can shop. A `catalog_editor` can shop and author products. An `admin` can shop, author products, and assign roles to users. Catalog authoring means creating and editing rows in `public.products`.

## Plan of Work

First, add a new Supabase migration at `supabase/migrations/20260623000000_admin_roles_catalog_authoring.sql`. It will create a `public.app_role` enum with `customer`, `catalog_editor`, and `admin`, add a `role` column to `public.profiles`, define `public.current_user_role()`, `public.is_admin()`, and `public.can_author_catalog()` helper functions, and add RLS policies that let admins read and update profiles and let admins or catalog editors select, insert, and update products. The existing public active product policy remains in place for customers and anonymous visitors.

Second, extend `lib/types.ts` with an `AppRole` type and add `role` to `Profile`. Update `lib/data.ts` so `mapProfile`, `getSessionContext`, and new admin loaders understand roles. Add `getAdminUsers()` for the user management screen, `getAdminProducts()` for the catalog screen, and `getAdminSessionContext()` to centralize admin authorization checks.

Third, add server actions. `app/actions/admin.ts` will include `updateUserRole` and verify the current user is an admin before updating another profile's role. `app/actions/catalog.ts` will include `createProduct` and `updateProduct` and rely on both an explicit role check and database RLS. These actions will validate product names, descriptions, prices, image URLs, inventory counts, and statuses before writing.

Fourth, create an admin route group. `app/admin/layout.tsx` will require Supabase to be configured and require the current user to be an admin or catalog editor. It will render the existing `SiteHeader` and admin navigation. `app/admin/page.tsx` will redirect users to the right default admin page. `app/admin/users/page.tsx` will require admin role and show role assignment forms. `app/admin/catalog/page.tsx` will allow admins and catalog editors to author products.

Fifth, update shared UI and docs. `components/site-header.tsx` will show an `Admin` link for `admin` and `catalog_editor` profiles. `README.md` and `AGENTS.md` will mention admin routes, roles, and the new migration.

## Concrete Steps

Run all commands from `/Users/ivalex/projects/codex_project1`.

Create the additive migration, update TypeScript files and route files, then run:

    npm run lint
    npm run build

If Supabase is configured locally, run the new migration after the existing migration. To bootstrap the first admin in a development database, manually update one known profile after registration:

    update public.profiles set role = 'admin' where email = 'admin@example.com';

That bootstrap SQL must be run only by a database owner or project maintainer. After one admin exists, further role changes happen in `/admin/users`.

## Validation and Acceptance

Run `npm run lint` and expect ESLint to complete without errors. Run `npm run build` and expect a production build to complete.

With Supabase configured, register or sign in as a normal customer and verify `/admin` redirects away. Promote that user's profile to `admin` in SQL, sign in again, and verify the header shows `Admin`. Visit `/admin/users`, change another user's role to `catalog_editor`, and verify the page reports success and the role persists after refresh. Sign in as the catalog editor and verify `/admin/catalog` is available while `/admin/users` redirects away. Create or edit a product from `/admin/catalog`, then verify active products appear on the storefront and archived products do not.

Validation completed during implementation:

    npm run lint
    Result: passed.

    npm run build
    Result: passed. Next.js compiled, TypeScript completed, and 12 app routes generated.

    curl -I http://localhost:3000
    Result: HTTP/1.1 200 OK after clearing the generated .next cache and restarting the dev server.

    curl -I http://localhost:3000/admin
    curl -I http://localhost:3000/admin/catalog
    curl -I http://localhost:3000/admin/users
    Result: HTTP/1.1 307 Temporary Redirect with location /login?redirectTo=/admin for signed-out requests.

Browser automation note: the `agent-browser` CLI described by the local verification skill was not installed, and the in-app browser tool was not exposed. Route-level checks were performed with `curl` instead.

Authenticated local flow note: the user confirmed the feature works locally after Supabase URL Configuration included `http://localhost:3000`, `http://localhost:3000/auth/callback`, and `http://localhost:3000/**`.

## Idempotence and Recovery

The migration is additive and uses `if not exists` where PostgreSQL supports it. Re-running the migration should not remove customer data. If a product form submission fails validation, no database write should occur and the form should show an error. If an admin accidentally archives a product, they can return to `/admin/catalog` and set the status back to `active`.

If the first admin bootstrap SQL targets the wrong email, run another update for the correct email. Avoid deleting profiles or products as part of this feature.

## Artifacts and Notes

Validation output will be recorded here after implementation.

Key validation transcript:

    > running-shoes-store@0.1.0 lint
    > eslint .

    > running-shoes-store@0.1.0 build
    > next build
    ✓ Compiled successfully
    Finished TypeScript
    ✓ Generating static pages (12/12)

    HTTP/1.1 200 OK
    http://localhost:3000

    HTTP/1.1 307 Temporary Redirect
    location: /login?redirectTo=/admin
    http://localhost:3000/admin

## Interfaces and Dependencies

In `lib/types.ts`, define:

    export type AppRole = "customer" | "catalog_editor" | "admin";

The `Profile` type must include:

    role: AppRole;

In `lib/data.ts`, expose:

    export async function getAdminSessionContext()
    export async function getAdminUsers()
    export async function getAdminProducts()

In `app/actions/admin.ts`, expose:

    export async function updateUserRole(previousState: AdminActionState, formData: FormData): Promise<AdminActionState>

In `app/actions/catalog.ts`, expose:

    export async function createProduct(previousState: CatalogActionState, formData: FormData): Promise<CatalogActionState>
    export async function updateProduct(previousState: CatalogActionState, formData: FormData): Promise<CatalogActionState>

Revision note 2026-06-23: Initial ExecPlan created to make the admin console work self-contained and auditable before implementation.

Revision note 2026-06-23: Updated progress after adding the migration, role-aware data layer, server actions, admin routes, navigation, and documentation. Added the first-admin bootstrap trigger discovery because it changed the migration design.

Revision note 2026-06-23: Added validation results, dev-server cache recovery note, and completion outcome.

Revision note 2026-06-23: Added the user-confirmed localhost Supabase redirect configuration and updated the outcome to reflect authenticated local verification.
