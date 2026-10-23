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

-- customer_register / place_order live in supabase-v3.sql (mobile-only login, no PIN)

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

grant execute on function claim_barista, set_barista_pin, set_sold_out, complete_order to anon, authenticated;
