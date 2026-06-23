# StrideForge Running Shoes Store

A responsive running shoes store built with Next.js, React, TypeScript, Tailwind CSS, and Supabase. The app includes a dark storefront, product catalog, client-side cart, account registration, username/email login, social login hooks, favorites, profile management, a dedicated cart checkout flow, and paid order history.

## Requirements Implemented

- Dark running shoes storefront with orange accents
- Responsive catalog cards and client-side cart count
- Product detail pages with larger images, required size/color selection, sizing info, specs, fit notes, stock status, favorites, and add-to-basket
- Supabase-backed auth and account data
- Email/password registration and login with email or username alias
- Google, Facebook, and Apple OAuth entry points through Supabase
- Registration password policy requiring at least 8 characters, one uppercase letter, one number, and one special character
- Profile page with editable username, display name, phone, and avatar URL
- Favorites page with saved products and basket helper
- Dedicated cart page with US shipping address, delivery options, fixed tax/shipping totals, and fake card payment handling
- Orders page with current and past orders, line items, status, payment status, delivery details, payment summary, and cancellation for pending/processing orders
- Admin console for assigning user roles and authoring catalog products, including detail page content
- Supabase SQL migrations with tables, seed products, RLS policies, profile trigger, username lookup RPC, catalog authoring permissions, checkout metadata, product detail fields, and product size/color options

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

4. Run the migrations in order using the Supabase SQL editor or Supabase CLI:

```text
supabase/migrations/20260622000000_accounts_orders_favorites.sql
supabase/migrations/20260623000000_admin_roles_catalog_authoring.sql
supabase/migrations/20260624000000_checkout_metadata.sql
supabase/migrations/20260625000000_product_details.sql
supabase/migrations/20260626000000_product_size_color_options.sql
supabase/migrations/20260627000000_product_color_images.sql
```

5. In Supabase Dashboard -> Authentication -> URL Configuration, set Site URL to:

```text
http://localhost:3000
```

6. Add these Redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3000/**
```

7. Restart the dev server after changing `.env.local`.

## Existing Database Update

If this app is already running against an existing Supabase project, apply only the new migrations that have not been run yet. For the size and color picker functionality, run:

```text
supabase/migrations/20260625000000_product_details.sql
supabase/migrations/20260626000000_product_size_color_options.sql
supabase/migrations/20260627000000_product_color_images.sql
```

`20260625000000_product_details.sql` adds product detail fields used by the product detail page. `20260626000000_product_size_color_options.sql` adds `available_sizes` and `available_colors` to `products`, adds selected size/color snapshot fields to `order_items`, and seeds size/color options for the existing demo products. `20260627000000_product_color_images.sql` adds image URLs to the existing demo color options so the product detail image can change when a shopper picks a color.

You can apply these files in the Supabase SQL editor by opening each file, pasting its SQL, and running it in order. After the database update, restart the Next.js dev server and use `/admin/catalog` to review or edit each product's available sizes and colors. Color lines support `Name: #RRGGBB | Image URL`; when the image URL is present, the product detail image switches to that image after the color is selected.

## Admin Setup

The first admin must be bootstrapped by a database owner after that user registers. In development, replace the email and run:

```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```

After that, the admin can use `/admin/users` to assign `customer`, `catalog_editor`, and `admin` roles. Admins and catalog editors can use `/admin/catalog` to create products, update product details, maintain size and color options, sizing info, fit notes, specs, and archive products. Archived products remain in the database for order history but do not appear in the public storefront or product detail pages.

If login or registration sends the browser to a deployed Vercel URL while testing locally, recheck Supabase Authentication -> URL Configuration. The local Site URL and Redirect URLs above must be saved for localhost testing.

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

## Checkout Testing

Checkout uses a local mock payment processor for development and demos. It does not call Stripe, require payment keys, or store full card numbers.

- Successful payment: `4242 4242 4242 4242`, any future `MM/YY` date, any three-digit CVC.
- Declined payment: `4000 0000 0000 9995`, any future `MM/YY` date, any three-digit CVC.
- Other card numbers are rejected as invalid.

Standard delivery is `$8`, or free when the cart subtotal is at least `$150`. Express delivery is `$18`. Tax is calculated as `8.25%` of subtotal plus shipping and rounded to the nearest whole dollar.

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
- `app/products/[id]/page.tsx`: public product detail page route
- `components/storefront.tsx`: catalog, favorites buttons, and cart count link
- `components/product-detail.tsx`: product detail page interactions, favorites, stock display, and add-to-basket
- `components/cart-page.tsx`: cart contents, delivery choices, fake payment inputs, and checkout action
- `app/actions/*.ts`: auth, profile, favorites, and order server actions
- `app/account/*`: protected profile, order, and favorites pages
- `app/admin/*`: protected admin console for user permissions and catalog authoring
- `lib/supabase/*`: Supabase client, config, and middleware helpers
- `lib/checkout.ts`: delivery options, tax/shipping totals, address validation, and mock payment rules
- `lib/data.ts`: server data loading and row-to-domain mapping
- `supabase/migrations/20260622000000_accounts_orders_favorites.sql`: database schema, RLS, seed products
- `supabase/migrations/20260623000000_admin_roles_catalog_authoring.sql`: roles, admin policies, and catalog author policies
- `supabase/migrations/20260624000000_checkout_metadata.sql`: delivery and payment metadata for orders
- `supabase/migrations/20260625000000_product_details.sql`: sizing, fit, and specs fields for product detail pages
- `supabase/migrations/20260626000000_product_size_color_options.sql`: product size/color options and order item variant snapshots
- `supabase/migrations/20260627000000_product_color_images.sql`: demo product color image URLs
- `next.config.mjs`: Next.js image host configuration

## Validation Checklist

- Register with email/password and username.
- Confirm weak registration passwords are rejected unless they include 8+ characters, an uppercase letter, a number, and a special character.
- Log in with email and with username alias.
- Register or log in with Google after provider credentials are configured.
- Start Facebook/Apple OAuth flows after provider credentials are configured.
- Add and remove favorites.
- Confirm catalog cards show available color swatches and do not show an add-to-basket button.
- Open `/products/1` and confirm the detail page shows a larger image, size picker, color picker, sizing info, specs, fit notes, stock status, favorite button, and add-to-basket button.
- Confirm add-to-basket is disabled until size and color are selected.
- Add the same shoe in two size/color combinations, confirm the Cart count updates, open `/cart`, and confirm separate variant lines appear.
- Enter a US shipping address, choose delivery, pay with fake card `4242 4242 4242 4242`, and confirm a paid processing order appears under `/account/orders` with size and color shown on each line item.
- Confirm fake card `4000 0000 0000 9995` is declined and does not create a new order.
- Confirm standard shipping becomes free at `$150` subtotal and express remains `$18`.
- Confirm buying while signed out redirects to `/login`.
- Cancel a pending or processing order.
- Confirm delivered or canceled orders do not show a cancel button.
- Check `/account`, `/account/orders`, and `/account/favorites` redirect unauthenticated users when Supabase is configured.
- Confirm customers cannot open `/admin`.
- Confirm admins can assign roles at `/admin/users`.
- Confirm admins and catalog editors can create, update, activate, archive products, and edit sizes/colors/sizing/specs/fit notes at `/admin/catalog`.
- Confirm inventory `0` products are hidden from public catalog and favorites, and cannot be purchased from product detail pages.
