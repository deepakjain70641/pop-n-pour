-- Pop & Pour v3 — run AFTER supabase-v2.sql. Safe to re-run.
-- Changes: customers log in with mobile number only (no PIN); pay-at-order flow (paid_at);
--          customers can track an order's status and see their order history.

alter table customers alter column pin_hash drop not null;
alter table orders add column if not exists paid_at timestamptz;

drop function if exists customer_login(text, text);
drop function if exists customer_register(text, text, text, date);
drop function if exists reset_customer_pin(text, text);

-- Mobile-only login. Returns null when the number is not registered (kiosk then asks for a name).
create or replace function customer_login(p_phone text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', id, 'name', name, 'phone', phone, 'stamps', stamps) from customers where phone = p_phone
$$;

create or replace function customer_register(p_name text, p_phone text, p_birthday date default null) returns json
language plpgsql security definer set search_path = public as $$
declare c customers;
begin
  if p_phone !~ '^\d{10}$' then raise exception 'Enter a 10-digit mobile number'; end if;
  if exists (select 1 from customers where phone = p_phone) then raise exception 'This number is already registered.'; end if;
  insert into customers (name, phone, birthday) values (p_name, p_phone, p_birthday) returning * into c;
  return json_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'stamps', c.stamps);
end $$;

-- Live status of one order (looked up by its unguessable uuid, so a guest can track too)
create or replace function order_status(p_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('order_no', order_no, 'status', status, 'paid', paid_at is not null, 'total', total) from orders where id = p_id
$$;

-- A customer's last 30 orders
create or replace function customer_orders(p_customer_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', id, 'order_no', order_no, 'created_at', created_at, 'items', items,
           'total', total, 'status', status, 'paid', paid_at is not null) order by created_at desc), '[]')
  from (select * from orders where customer_id = p_customer_id order by created_at desc limit 30) o
$$;

-- Orders: prices, promo and reward are recomputed from the database; the browser's numbers are ignored.
-- Reward: 8 stamps = one free Sparkling Soda (cheapest sparkling soda in the cart).  (moved here from supabase-v2.sql)
drop function if exists place_order(jsonb);
create or replace function place_order(p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; mi menu_items; v_unit numeric; v_add numeric; v_names text[]; v_qty int; v_size text; v_line numeric;
  v_sub numeric := 0; v_items jsonb := '[]'; v_promo promos; v_pd numeric := 0; v_rd numeric := 0;
  v_cust customers; v_free numeric; v_total numeric; v_no bigint; v_id uuid;
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
  returning id, order_no into v_id, v_no;
  return json_build_object('id', v_id, 'order_no', v_no, 'total', v_total, 'stamps', v_cust.stamps);
end $$;

grant execute on function customer_login(text), customer_register(text, text, date), order_status(uuid), customer_orders(uuid), place_order(jsonb) to anon, authenticated;
