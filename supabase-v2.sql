-- Pop & Pour v2 — run AFTER supabase.sql. Safe to re-run.
-- Adds: menu in DB (sold-out + server price check), barista PIN login, birthday, cancel reason, 8-stamp free soda.

create table if not exists menu_items (
  id text primary key,
  cat text not null,           -- sparkling | popping | milktea | boba | matcha | sugarfree | addon
  name text not null,
  descr text,
  price_r numeric not null check (price_r >= 0),
  price_l numeric check (price_l >= 0),
  sort int not null default 0,
  sold_out boolean not null default false
);
create table if not exists settings (key text primary key, value text);
alter table customers add column if not exists birthday date;
alter table orders add column if not exists cancel_reason text;

alter table menu_items enable row level security;
alter table settings enable row level security;   -- no policies: only reachable via functions below

drop policy if exists "anyone reads menu" on menu_items;
create policy "anyone reads menu" on menu_items for select to anon, authenticated using (true);
drop policy if exists "owner manages menu" on menu_items;
create policy "owner manages menu" on menu_items for all to authenticated using (staff_role() = 'owner') with check (staff_role() = 'owner');

-- Seed menu (skips rows that already exist)
insert into menu_items (id, cat, name, descr, price_r, price_l, sort) values
  ('chewy','addon','Chewy Boba',null,30,null,1),
  ('popping','addon','Popping Boba',null,30,null,2),
  ('sp0','sparkling','Peach Pop','Peach syrup + soda + ice',90,null,10),
  ('sp1','sparkling','Kiwi Cooler','Kiwi syrup + soda + ice',90,null,11),
  ('sp2','sparkling','Cherry Lime','Cherry syrup + lime + soda + ice',90,null,12),
  ('sp3','sparkling','Berry Bloom','Mixed berry syrup + soda + ice',90,null,13),
  ('sp4','sparkling','Blue Punch','Blue curacao style syrup + soda + ice',90,null,14),
  ('sp5','sparkling','Pineapple Chilli Twist','Pineapple syrup + hint of chilli + soda + ice',90,null,15),
  ('sp6','sparkling','Berry Blast','Strawberry & berry mix + soda + ice',90,null,16),
  ('po0','popping','Peach Pop','Peach syrup + soda + popping boba',120,null,20),
  ('po1','popping','Kiwi Cooler','Kiwi syrup + soda + popping boba',120,null,21),
  ('po2','popping','Cherry Lime','Cherry syrup + lime + soda + popping boba',120,null,22),
  ('po3','popping','Berry Bloom','Mixed berry syrup + soda + popping boba',120,null,23),
  ('po4','popping','Blue Punch','Blue curacao style syrup + soda + popping boba',120,null,24),
  ('po5','popping','Pineapple Chilli Twist','Pineapple syrup + hint of chilli + soda + popping boba',120,null,25),
  ('po6','popping','Berry Blast','Strawberry & berry mix + soda + popping boba',120,null,26),
  ('mt0','milktea','Taro Milk Tea','Taro + milk',160,190,30),
  ('mt1','milktea','Thai Milk Tea','Thai tea + milk',160,190,31),
  ('mt2','milktea','Tiramisu Milk Tea','Tiramisu + milk',160,190,32),
  ('mt3','milktea','Chocolate Milk Tea','Chocolate + milk',160,190,33),
  ('mt4','milktea','Strawberry Milk Tea','Strawberry + milk',160,190,34),
  ('mt5','milktea','Mango Milk Tea','Mango + milk',160,190,35),
  ('mt6','milktea','Iced Coffee','Coffee + milk',160,190,36),
  ('mb0','boba','Taro Boba','Taro + milk + chewy boba',170,200,40),
  ('mb1','boba','Thai Tea Boba','Thai tea + milk + chewy boba',170,200,41),
  ('mb2','boba','Tiramisu Boba','Tiramisu + milk + chewy boba',170,200,42),
  ('mb3','boba','Chocolate Boba','Chocolate + milk + chewy boba',170,200,43),
  ('mb4','boba','Strawberry Boba','Strawberry + milk + chewy boba',170,200,44),
  ('mb5','boba','Mango Boba','Mango + milk + chewy boba',170,200,45),
  ('mb6','boba','Coffee Boba','Coffee + milk + chewy boba',170,200,46),
  ('ma0','matcha','Matcha','Premium matcha + milk',180,200,50),
  ('ma1','matcha','Mango Matcha','Matcha + mango + milk',200,230,51),
  ('ma2','matcha','Strawberry Matcha','Matcha + strawberry + milk',200,230,52),
  ('sf0','sugarfree','Lemon Mint Soda','Fresh lemon + mint + soda',120,null,60),
  ('sf1','sugarfree','Iced Americano','Black coffee + ice',120,null,61),
  ('sf2','sugarfree','Espresso Soda','Espresso + sparkling soda',120,null,62),
  ('sf3','sugarfree','Iced Coffee','Coffee + milk',190,null,63),
  ('sf4','sugarfree','Dark Mocha Latte','Coffee + chocolate + milk',190,null,64),
  ('sf5','sugarfree','Matcha Latte','Matcha + milk',220,null,65)
on conflict (id) do nothing;

-- Default barista PIN 1234 — change it from Management → Settings
insert into settings (key, value) values ('barista_pin_hash', crypt('1234', gen_salt('bf'))) on conflict (key) do nothing;

-- Barista PIN login: app signs in anonymously, then claims the barista role with the PIN
create or replace function claim_barista(p_pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from settings where key = 'barista_pin_hash' and value = crypt(p_pin, value)) then
    raise exception 'Wrong PIN';
  end if;
  insert into staff (user_id, role, name) values (auth.uid(), 'barista', 'Counter') on conflict (user_id) do nothing;
end $$;

create or replace function set_barista_pin(p_pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role() is distinct from 'owner' then raise exception 'Not authorised'; end if;
  if p_pin !~ '^\d{4,6}$' then raise exception 'PIN must be 4–6 digits'; end if;
  update settings set value = crypt(p_pin, gen_salt('bf')) where key = 'barista_pin_hash';
end $$;

create or replace function set_sold_out(p_id text, p_sold_out boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role() is null then raise exception 'Not authorised'; end if;
  update menu_items set sold_out = p_sold_out where id = p_id;
end $$;

-- Register now takes an optional birthday
drop function if exists customer_register(text, text, text);
create or replace function customer_register(p_name text, p_phone text, p_pin text, p_birthday date default null) returns json
language plpgsql security definer set search_path = public as $$
declare c customers;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if exists (select 1 from customers where phone = p_phone) then raise exception 'This number is already registered. Please log in.'; end if;
  insert into customers (name, phone, pin_hash, birthday) values (p_name, p_phone, crypt(p_pin, gen_salt('bf')), p_birthday) returning * into c;
  return json_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'stamps', c.stamps);
end $$;

-- Orders: prices, promo and reward are recomputed from the database; the browser's numbers are ignored.
-- Reward: 8 stamps = one free Sparkling Soda (cheapest sparkling soda in the cart).
drop function if exists place_order(jsonb);
create or replace function place_order(p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; mi menu_items; v_unit numeric; v_add numeric; v_names text[]; v_qty int; v_size text; v_line numeric;
  v_sub numeric := 0; v_items jsonb := '[]'; v_promo promos; v_pd numeric := 0; v_rd numeric := 0;
  v_cust customers; v_free numeric; v_total numeric; v_no bigint;
begin
  if coalesce(jsonb_array_length(p->'items'), 0) = 0 then raise exception 'Cart is empty'; end if;
  if nullif(p->>'customer_id', '') is not null then
    select * into v_cust from customers where id = (p->>'customer_id')::uuid;
  end if;

  for it in select * from jsonb_array_elements(p->'items') loop
    select * into mi from menu_items where id = it->>'id' and cat <> 'addon';
    if not found then raise exception 'Unknown item %', it->>'id'; end if;
    if mi.sold_out then raise exception '% is sold out', mi.name; end if;
    v_size := coalesce(it->>'size', 'R');
    v_qty := greatest(coalesce((it->>'qty')::int, 1), 1);
    v_unit := case when v_size = 'L' then mi.price_l else mi.price_r end;
    if v_unit is null then raise exception 'Size % not available for %', v_size, mi.name; end if;
    select coalesce(sum(price_r), 0), coalesce(array_agg(name order by sort), '{}') into v_add, v_names
      from menu_items where cat = 'addon' and id in (select jsonb_array_elements_text(coalesce(it->'addons', '[]')));
    v_line := (v_unit + v_add) * v_qty;
    v_sub := v_sub + v_line;
    if mi.cat = 'sparkling' then v_free := least(coalesce(v_free, v_unit), v_unit); end if;
    v_items := v_items || jsonb_build_object('id', mi.id, 'name', mi.name, 'cat', mi.cat, 'size', v_size,
      'addons', to_jsonb(v_names), 'qty', v_qty, 'unit', v_unit, 'line_total', v_line);
  end loop;

  if nullif(p->>'promo_code', '') is not null then
    select * into v_promo from promos where code = upper(p->>'promo_code') and active;
    if not found then raise exception 'Invalid or expired promo code'; end if;
    if v_sub < v_promo.min_order then raise exception 'Minimum order ₹% for this code', v_promo.min_order; end if;
    v_pd := least(v_sub, case when v_promo.type = 'percent' then v_sub * v_promo.value / 100 else v_promo.value end);
  end if;

  if coalesce((p->>'reward_redeemed')::boolean, false) then
    if v_cust.id is null or v_cust.stamps < 8 then raise exception 'Not enough stamps for a free drink'; end if;
    if v_free is null then raise exception 'Add a Sparkling Soda to use your free drink'; end if;
    v_rd := least(v_free, v_sub - v_pd);
  end if;

  v_total := greatest(0, round(v_sub - v_pd - v_rd));
  insert into orders (customer_id, customer_name, customer_phone, items, subtotal, discount, promo_code, reward_redeemed, total)
  values (v_cust.id, coalesce(v_cust.name, nullif(p->>'customer_name', '')), v_cust.phone, v_items, v_sub, v_pd + v_rd, v_promo.code, v_rd > 0, v_total)
  returning order_no into v_no;
  return json_build_object('order_no', v_no, 'total', v_total, 'stamps', v_cust.stamps);
end $$;

-- 1 stamp per completed order; a redeemed reward costs 8 stamps
create or replace function complete_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if staff_role() is null then raise exception 'Not authorised'; end if;
  update orders set status = 'completed', completed_at = now()
    where id = p_order_id and status <> 'completed' returning * into o;
  if not found then return; end if;
  if o.customer_id is not null then
    update customers set stamps = greatest(stamps + 1 - case when o.reward_redeemed then 8 else 0 end, 0)
      where id = o.customer_id;
  end if;
end $$;

grant execute on function claim_barista, set_barista_pin, set_sold_out, customer_register, place_order, complete_order to anon, authenticated;
