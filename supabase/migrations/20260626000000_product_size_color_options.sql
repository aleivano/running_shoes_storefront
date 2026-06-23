alter table public.products
add column if not exists available_sizes jsonb not null default '["7","8","9","10","11","12","13"]'::jsonb,
add column if not exists available_colors jsonb not null default '[{"name":"Black","hex":"#111827"}]'::jsonb;

alter table public.order_items
add column if not exists selected_size text not null default '',
add column if not exists selected_color_name text not null default '',
add column if not exists selected_color_hex text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_available_sizes_is_array'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_available_sizes_is_array check (jsonb_typeof(available_sizes) = 'array');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_available_colors_is_array'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_available_colors_is_array check (jsonb_typeof(available_colors) = 'array');
  end if;
end $$;

update public.products
set
  available_sizes = '["7","8","9","10","11","12","13"]'::jsonb,
  available_colors = '[
    {"name":"Volt Orange","hex":"#F97316"},
    {"name":"Black","hex":"#111827"},
    {"name":"White","hex":"#F8FAFC"},
    {"name":"Electric Blue","hex":"#2563EB"}
  ]'::jsonb
where id = 1;

update public.products
set
  available_sizes = '["7","8","9","10","11","12","13","14"]'::jsonb,
  available_colors = '[
    {"name":"Ember","hex":"#C2410C"},
    {"name":"Forest","hex":"#166534"},
    {"name":"Stone","hex":"#78716C"}
  ]'::jsonb
where id = 2;

update public.products
set
  available_sizes = '["6","7","8","9","10","11","12","13"]'::jsonb,
  available_colors = '[
    {"name":"Mist","hex":"#CBD5E1"},
    {"name":"Navy","hex":"#1E3A8A"},
    {"name":"Coral","hex":"#FB7185"},
    {"name":"Black","hex":"#111827"}
  ]'::jsonb
where id = 3;

update public.products
set
  available_sizes = '["7","8","9","10","11","12","13"]'::jsonb,
  available_colors = '[
    {"name":"White Flame","hex":"#F8FAFC"},
    {"name":"Crimson","hex":"#DC2626"},
    {"name":"Hyper Lime","hex":"#84CC16"}
  ]'::jsonb
where id = 4;

update public.products
set
  available_sizes = '["6","7","8","9","10","11","12"]'::jsonb,
  available_colors = '[
    {"name":"Knit Black","hex":"#18181B"},
    {"name":"Sand","hex":"#D6D3D1"},
    {"name":"Sky","hex":"#38BDF8"}
  ]'::jsonb
where id = 5;

update public.products
set
  available_sizes = '["7","8","9","10","11","12","13","14"]'::jsonb,
  available_colors = '[
    {"name":"Graphite","hex":"#374151"},
    {"name":"Safety Orange","hex":"#EA580C"},
    {"name":"Royal","hex":"#1D4ED8"}
  ]'::jsonb
where id = 6;

update public.products
set
  available_sizes = '["6","7","8","9","10","11","12","13"]'::jsonb,
  available_colors = '[
    {"name":"Cloud","hex":"#E5E7EB"},
    {"name":"Sage","hex":"#86EFAC"},
    {"name":"Midnight","hex":"#0F172A"}
  ]'::jsonb
where id = 7;

update public.products
set
  available_sizes = '["7","8","9","10","11","12","13"]'::jsonb,
  available_colors = '[
    {"name":"Volt","hex":"#A3E635"},
    {"name":"Track Red","hex":"#EF4444"},
    {"name":"Black","hex":"#111827"}
  ]'::jsonb
where id = 8;
