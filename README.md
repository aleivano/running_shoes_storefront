# StrideForge Running Shoes Store

A responsive running shoes store built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. The app includes a dark storefront, product catalog, client-side basket, account registration, username/email login, social login hooks, favorites, profile management, and checkout-ready order history.

## Requirements Implemented

- Dark running shoes storefront with orange accents
- Responsive catalog cards and client-side shopping basket
- Supabase-backed auth and account data
- Email/password registration and login with email or username alias
- Google, Facebook, and Apple OAuth entry points through Supabase
- Registration password policy requiring at least 8 characters, one uppercase letter, one number, and one special character
- Profile page with editable username, display name, phone, and avatar URL
- Favorites page with saved products and basket helper
- Checkout-ready order creation from the basket
- Orders page with current and past orders, line items, status, payment status, and cancellation for pending/processing orders
- Supabase SQL migration with tables, seed products, RLS policies, profile trigger, and username lookup RPC

## Tech Stack

- Next.js App Router
- React Server Components and Client Components
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Row Level Security
- ESLint

## Run Locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the storefront still renders with seed product data. Account, favorites, and order persistence require Supabase configuration.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local`.
3. Copy the project URL and anon key from Supabase Dashboard -> Project Settings -> API into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the migration in `supabase/migrations/20260622000000_accounts_orders_favorites.sql` using the Supabase SQL editor or Supabase CLI.
5. In Supabase Dashboard -> Authentication -> URL Configuration, set Site URL to:

```text
http://localhost:3000
```

6. Add this Redirect URL:

```text
http://localhost:3000/auth/callback
```

7. Restart the dev server after changing `.env.local`.

## Social Login Setup

Social registration and login use Supabase OAuth providers. The app has buttons for Google, Facebook, and Apple; each provider must be enabled in Supabase before it will work.

For Google:

1. In Supabase Dashboard -> Authentication -> Providers -> Google, copy the callback URL shown by Supabase. It usually looks like:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

2. In Google Cloud Console -> APIs & Services -> OAuth consent screen, configure the app name and required consent fields.
3. In Google Cloud Console -> APIs & Services -> Credentials, create an OAuth Client ID for a Web application.
4. Add the Supabase callback URL as an Authorized redirect URI in Google.
5. Copy the Google Client ID and Client Secret into the Supabase Google provider settings.
6. Save the provider settings and test from `http://localhost:3000/register`.

Use the same pattern for Facebook and Apple: create provider credentials in the provider dashboard, use the Supabase callback URL, then paste the credentials into Supabase Authentication -> Providers.

## Useful Commands

```bash
npm run lint
npm run build
npm run start
npm audit --omit=dev
```

`npm run dev` uses `next dev --webpack` because the current PostCSS security override conflicts with Turbopack's dev-time PostCSS adapter.

## Key Files

- `app/page.tsx`: server entry for storefront data and session context
- `components/storefront.tsx`: catalog, favorites buttons, basket, and checkout action
- `app/actions/*.ts`: auth, profile, favorites, and order server actions
- `app/account/*`: protected profile, order, and favorites pages
- `lib/supabase/*`: Supabase client, config, and middleware helpers
- `lib/data.ts`: server data loading and row-to-domain mapping
- `supabase/migrations/20260622000000_accounts_orders_favorites.sql`: database schema, RLS, seed products
- `next.config.mjs`: Next.js image host configuration

## Validation Checklist

- Register with email/password and username.
- Confirm weak registration passwords are rejected unless they include 8+ characters, an uppercase letter, a number, and a special character.
- Log in with email and with username alias.
- Register or log in with Google after provider credentials are configured.
- Start Facebook/Apple OAuth flows after provider credentials are configured.
- Add and remove favorites.
- Add shoes to basket, buy while signed in, and confirm an order appears under `/account/orders`.
- Confirm buying while signed out redirects to `/login`.
- Cancel a pending or processing order.
- Confirm delivered or canceled orders do not show a cancel button.
- Check `/account`, `/account/orders`, and `/account/favorites` redirect unauthenticated users when Supabase is configured.
