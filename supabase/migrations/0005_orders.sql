-- Orders, and the one way to create one.
--
-- An order is written by a Postgres function rather than by the API, because
-- what makes an order correct — today's price, stock that is actually there —
-- cannot be decided by the caller. The tables below therefore hand the API no
-- write privileges at all.

-- Human-readable order codes. The buyer puts this in the transfer description
-- and she matches it against the bank statement, so it has to survive being
-- read down a phone line: no ambiguity between O and 0, no uuid.
create sequence order_code_seq;

create table orders (
  id         bigint generated always as identity primary key,
  buyer_id   uuid not null references auth.users (id) on delete restrict,
  code       text not null unique,
  -- Where it is going, copied rather than referenced. An address is a fact
  -- about a delivery, not about a member: changing where you live later must
  -- not rewrite where last month's parcel was sent.
  full_name  text not null,
  phone      text not null,
  city       text not null,
  district   text not null,
  address    text not null,
  total      numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references orders (id) on delete cascade,
  product_id bigint not null references products (id) on delete restrict,
  quantity   integer not null check (quantity > 0),
  -- The price at the time, not a join to products. A price change next month
  -- must not rewrite what somebody already paid.
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

create index order_items_order_id_idx on order_items (order_id);

-- Placing an order.
--
-- SECURITY DEFINER because it does what the caller may not: write an order and
-- spend stock. The buyer is taken from the verified session rather than from an
-- argument, so there is nothing here to point at somebody else.
create function place_order(
  items jsonb,
  full_name text,
  phone text,
  city text,
  district text,
  address text
) returns text
language plpgsql
security definer
-- Pinned, because a definer function that resolves names through the caller's
-- search_path runs whatever they put in front of it.
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  new_order_id bigint;
  new_code text;
begin
  insert into orders (buyer_id, code, full_name, phone, city, district, address, total)
  values (
    auth.uid(),
    'IS-' || lpad(nextval('order_code_seq')::text, 5, '0'),
    full_name,
    phone,
    city,
    district,
    address,
    (
      select coalesce(sum(p.price * i.quantity), 0)
      from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
      join products p on p.id = i.product_id
    )
  )
  returning id, code into new_order_id, new_code;

  insert into order_items (order_id, product_id, quantity, unit_price)
  select new_order_id, i.product_id, i.quantity, p.price
  from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
  join products p on p.id = i.product_id;

  return new_code;
end;
$$;

-- Deny by default, on both tables, before anything is granted.
alter table orders enable row level security;
alter table order_items enable row level security;

-- Two separate gates, easily mistaken for one: GRANT decides whether a role may
-- touch the table at all, RLS then decides which rows it sees. Select only —
-- the write verbs are never granted, so an order can only ever come from
-- place_order, and the missing write policies are a second lock on that door.
grant select on orders to authenticated;

-- auth.uid() is the id from the request's verified JWT, not a value the client
-- supplied.
create policy "members read their own orders"
on orders
for select
to authenticated
using ((select auth.uid()) = buyer_id);
