create extension if not exists pgcrypto;

create table staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('barista','owner')),
  name text
);
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  pin_hash text not null,
  stamps int not null default 0,
  created_at timestamptz not null default now()
);
create table promos (
  code text primary key,
  type text not null check (type in ('percent','flat')),
  value numeric not null check (value > 0),
  min_order numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  customer_id uuid references customers(id),
  customer_name text,
  customer_phone text,
  items jsonb not null,
  subtotal numeric not null,
  discount numeric not null default 0,
  promo_code text,
  reward_redeemed boolean not null default false,
  total numeric not null,
  status text not null default 'new' check (status in ('new','preparing','ready','completed','cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index on orders (status, created_at);

alter table staff enable row level security;
alter table customers enable row level security;
alter table promos enable row level security;
alter table orders enable row level security;

create or replace function staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from staff where user_id = auth.uid()
$$;

create policy "staff read self" on staff for select to authenticated using (user_id = auth.uid());
create policy "owner reads customers" on customers for select to authenticated using (staff_role() = 'owner');
create policy "anyone reads active promos" on promos for select to anon, authenticated using (active);
create policy "owner manages promos" on promos for all to authenticated using (staff_role() = 'owner') with check (staff_role() = 'owner');
create policy "staff read orders" on orders for select to authenticated using (staff_role() in ('barista','owner'));
create policy "staff update orders" on orders for update to authenticated using (staff_role() in ('barista','owner'));

create or replace function place_order(p jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_no bigint;
begin
  insert into orders (customer_id, customer_name, customer_phone, items, subtotal, discount, promo_code, reward_redeemed, total)
  values (nullif(p->>'customer_id','')::uuid, p->>'customer_name', p->>'customer_phone', p->'items',
          (p->>'subtotal')::numeric, coalesce((p->>'discount')::numeric,0), p->>'promo_code',
          coalesce((p->>'reward_redeemed')::boolean,false), (p->>'total')::numeric)
  returning order_no into v_no;
  return v_no;
end $$;

create or replace function customer_register(p_name text, p_phone text, p_pin text) returns json
language plpgsql security definer set search_path = public as $$
declare c customers;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'PIN must be 4 digits'; end if;
  if exists (select 1 from customers where phone = p_phone) then raise exception 'This number is already registered. Please log in.'; end if;
  insert into customers (name, phone, pin_hash) values (p_name, p_phone, crypt(p_pin, gen_salt('bf'))) returning * into c;
  return json_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'stamps', c.stamps);
end $$;

create or replace function customer_login(p_phone text, p_pin text) returns json
language plpgsql security definer set search_path = public as $$
declare c customers;
begin
  select * into c from customers where phone = p_phone and pin_hash = crypt(p_pin, pin_hash);
  if not found then raise exception 'Invalid phone or PIN'; end if;
  return json_build_object('id', c.id, 'name', c.name, 'phone', c.phone, 'stamps', c.stamps);
end $$;

create or replace function reset_customer_pin(p_phone text, p_pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if staff_role() is null then raise exception 'Not authorised'; end if;
  if p_pin !~ '^\d{4}$' then raise exception 'PIN must be 4 digits'; end if;
  update customers set pin_hash = crypt(p_pin, gen_salt('bf')) where phone = p_phone;
  if not found then raise exception 'Customer not found'; end if;
end $$;

create or replace function complete_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if staff_role() is null then raise exception 'Not authorised'; end if;
  update orders set status = 'completed', completed_at = now()
    where id = p_order_id and status <> 'completed' returning * into o;
  if not found then return; end if;
  if o.customer_id is not null then
    update customers set stamps = greatest(stamps + 1 - case when o.reward_redeemed then 10 else 0 end, 0)
      where id = o.customer_id;
  end if;
end $$;

grant execute on function place_order, customer_register, customer_login, reset_customer_pin, complete_order to anon, authenticated;
