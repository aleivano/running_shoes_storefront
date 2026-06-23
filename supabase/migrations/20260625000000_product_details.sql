alter table public.products
add column if not exists sizing_info text not null default 'Available in US sizes 7-13. True-to-size fit for most runners.',
add column if not exists fit_notes text not null default 'Balanced running fit with secure midfoot lockdown and enough toe room for daily miles.',
add column if not exists specs jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_specs_is_array'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_specs_is_array check (jsonb_typeof(specs) = 'array');
  end if;
end $$;

update public.products
set
  sizing_info = 'US sizes 7-13. True-to-size with a close performance hold through the midfoot.',
  fit_notes = 'Best for neutral runners who want a fast, locked-in feel for tempo days and intervals.',
  specs = '[
    {"label":"Weight","value":"7.4 oz"},
    {"label":"Drop","value":"6 mm"},
    {"label":"Surface","value":"Road"},
    {"label":"Cushion","value":"Responsive foam"}
  ]'::jsonb
where id = 1;

update public.products
set
  sizing_info = 'US sizes 7-14. Runs slightly snug; consider a half size up for thicker trail socks.',
  fit_notes = 'Protective trail fit with a reinforced toe, grippy outsole, and stable platform on uneven ground.',
  specs = '[
    {"label":"Weight","value":"10.2 oz"},
    {"label":"Drop","value":"8 mm"},
    {"label":"Surface","value":"Technical trail"},
    {"label":"Lug depth","value":"5 mm"}
  ]'::jsonb
where id = 2;

update public.products
set
  sizing_info = 'US sizes 6-13. True-to-size with a roomy forefoot for longer runs.',
  fit_notes = 'Soft daily fit for high-mileage runners who want comfort without a sloppy upper.',
  specs = '[
    {"label":"Weight","value":"9.1 oz"},
    {"label":"Drop","value":"10 mm"},
    {"label":"Surface","value":"Road"},
    {"label":"Cushion","value":"Max comfort"}
  ]'::jsonb
where id = 3;

update public.products
set
  sizing_info = 'US sizes 7-13. Race fit; narrow-footed runners can stay true-to-size.',
  fit_notes = 'Snug race-day lockdown with a carbon plate and rocker geometry for efficient turnover.',
  specs = '[
    {"label":"Weight","value":"6.8 oz"},
    {"label":"Drop","value":"8 mm"},
    {"label":"Plate","value":"Full carbon"},
    {"label":"Best for","value":"Marathon racing"}
  ]'::jsonb
where id = 4;

update public.products
set
  sizing_info = 'US sizes 6-12. Flexible knit upper adapts to most foot shapes.',
  fit_notes = 'Easygoing urban fit with breathable stretch and moderate support for relaxed miles.',
  specs = '[
    {"label":"Weight","value":"8.6 oz"},
    {"label":"Drop","value":"8 mm"},
    {"label":"Upper","value":"Engineered knit"},
    {"label":"Surface","value":"Road and gym"}
  ]'::jsonb
where id = 5;

update public.products
set
  sizing_info = 'US sizes 7-14 including select wide-friendly volume. True-to-size.',
  fit_notes = 'Guided support and a broad base help reduce excess motion during daily training.',
  specs = '[
    {"label":"Weight","value":"10.5 oz"},
    {"label":"Drop","value":"10 mm"},
    {"label":"Support","value":"Stability"},
    {"label":"Cushion","value":"Structured foam"}
  ]'::jsonb
where id = 6;

update public.products
set
  sizing_info = 'US sizes 6-13. Roomy fit with extra volume through the forefoot.',
  fit_notes = 'Plush recovery ride with a wide base for easy days, walks, and post-race comfort.',
  specs = '[
    {"label":"Weight","value":"9.8 oz"},
    {"label":"Drop","value":"6 mm"},
    {"label":"Surface","value":"Road"},
    {"label":"Cushion","value":"Plush"}
  ]'::jsonb
where id = 7;

update public.products
set
  sizing_info = 'US sizes 7-13. Low-volume performance fit; consider a half size up if between sizes.',
  fit_notes = 'Snappy, low-profile fit for track sessions, intervals, and short fast road efforts.',
  specs = '[
    {"label":"Weight","value":"6.5 oz"},
    {"label":"Drop","value":"4 mm"},
    {"label":"Surface","value":"Track and road"},
    {"label":"Ride","value":"Firm and fast"}
  ]'::jsonb
where id = 8;
