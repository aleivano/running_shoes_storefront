do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('customer', 'catalog_editor', 'admin');
  end if;
end $$;

alter table public.profiles
add column if not exists role public.app_role not null default 'customer';

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select profiles.role from public.profiles where profiles.id = auth.uid()),
    'customer'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.app_role;
$$;

create or replace function public.can_author_catalog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('catalog_editor'::public.app_role, 'admin'::public.app_role);
$$;

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not public.is_admin()
  then
    raise exception 'Only admins can change user roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unauthorized_role_change on public.profiles;
create trigger prevent_unauthorized_role_change
before update on public.profiles
for each row execute function public.prevent_unauthorized_role_change();

drop policy if exists "profiles are readable by admins" on public.profiles;
create policy "profiles are readable by admins"
on public.profiles for select
using (public.is_admin());

drop policy if exists "profiles are updatable by admins" on public.profiles;
create policy "profiles are updatable by admins"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "catalog authors can read all products" on public.products;
create policy "catalog authors can read all products"
on public.products for select
using (public.can_author_catalog());

drop policy if exists "catalog authors can insert products" on public.products;
create policy "catalog authors can insert products"
on public.products for insert
with check (public.can_author_catalog());

drop policy if exists "catalog authors can update products" on public.products;
create policy "catalog authors can update products"
on public.products for update
using (public.can_author_catalog())
with check (public.can_author_catalog());
