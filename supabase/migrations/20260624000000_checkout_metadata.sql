alter table public.orders
add column if not exists delivery_option text not null default 'standard',
add column if not exists payment_provider text not null default 'mock',
add column if not exists payment_reference text,
add column if not exists payment_method jsonb not null default '{}'::jsonb;

alter table public.orders
drop constraint if exists orders_delivery_option_check;

alter table public.orders
add constraint orders_delivery_option_check
check (delivery_option in ('standard', 'express'));
