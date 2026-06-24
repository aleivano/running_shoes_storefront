alter table public.products
add column if not exists low_stock_threshold integer not null default 10
check (low_stock_threshold >= 0);

create or replace function public.decrement_product_inventory(
  p_product_id integer,
  p_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_product_id is null or p_quantity is null or p_quantity < 1 then
    return false;
  end if;

  update public.products
  set inventory = inventory - p_quantity
  where id = p_product_id
    and status = 'active'
    and inventory >= p_quantity;

  return found;
end;
$$;

revoke execute on function public.decrement_product_inventory(integer, integer) from public;
revoke execute on function public.decrement_product_inventory(integer, integer) from anon;
revoke execute on function public.decrement_product_inventory(integer, integer) from authenticated;

drop function if exists public.decrement_product_inventories(jsonb);
drop function if exists public.decrement_product_inventories(uuid, jsonb);

create or replace function public.decrement_product_inventories(
  p_order_id uuid,
  p_user_id uuid,
  p_items jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_count integer;
  available_count integer;
  updated_count integer;
begin
  if p_order_id is null or p_user_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.orders
    where id = p_order_id
      and user_id = p_user_id
      and status = 'processing'
      and payment_status = 'paid'
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.order_events
    where order_id = p_order_id
      and event_type = 'inventory_decremented'
  ) then
    return false;
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where not (
      item ? 'product_id'
      and item ? 'quantity'
      and (item->>'product_id') ~ '^[0-9]+$'
      and (item->>'quantity') ~ '^[0-9]+$'
      and (item->>'product_id')::integer > 0
      and (item->>'quantity')::integer > 0
    )
  ) then
    return false;
  end if;

  create temporary table requested_inventory_decrements (
    product_id integer primary key,
    quantity integer not null check (quantity > 0)
  ) on commit drop;

  insert into requested_inventory_decrements (product_id, quantity)
  select
    (item->>'product_id')::integer,
    sum((item->>'quantity')::integer)::integer
  from jsonb_array_elements(p_items) as item
  where item ? 'product_id'
    and item ? 'quantity'
    and (item->>'product_id') ~ '^[0-9]+$'
    and (item->>'quantity') ~ '^[0-9]+$'
  group by (item->>'product_id')::integer;

  select count(*) into requested_count
  from requested_inventory_decrements;

  if requested_count = 0 then
    return false;
  end if;

  if exists (
    select 1
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id
      group by product_id
    ) ordered
    full join requested_inventory_decrements requested
      on requested.product_id = ordered.product_id
    where ordered.product_id is null
       or requested.product_id is null
       or ordered.quantity <> requested.quantity
  ) then
    return false;
  end if;

  with locked_available_products as (
    select products.id
    from requested_inventory_decrements requested
    join public.products products
      on products.id = requested.product_id
     and products.status = 'active'
     and products.inventory >= requested.quantity
    for update of products
  )
  select count(*) into available_count
  from locked_available_products;

  if available_count <> requested_count then
    return false;
  end if;

  update public.products products
  set inventory = products.inventory - requested.quantity
  from requested_inventory_decrements requested
  where products.id = requested.product_id
    and products.status = 'active'
    and products.inventory >= requested.quantity;

  get diagnostics updated_count = row_count;

  if updated_count <> requested_count then
    return false;
  end if;

  insert into public.order_events (
    order_id,
    event_type,
    message
  )
  values (
    p_order_id,
    'inventory_decremented',
    'Product inventory was decremented for this paid order.'
  );

  return true;
end;
$$;

revoke execute on function public.decrement_product_inventories(uuid, uuid, jsonb) from public;
revoke execute on function public.decrement_product_inventories(uuid, uuid, jsonb) from anon;
revoke execute on function public.decrement_product_inventories(uuid, uuid, jsonb) from authenticated;
grant execute on function public.decrement_product_inventories(uuid, uuid, jsonb) to service_role;
