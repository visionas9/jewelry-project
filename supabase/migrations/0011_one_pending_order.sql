-- One unpaid order at a time.
--
-- The shop is havale/EFT only. A member with three pending orders has three
-- order codes against one bank transfer, holds the stock for all three, and
-- gives Hilal three rows to reconcile by hand against one statement line.
--
-- Enforced here rather than on the checkout page, because place_order is the
-- only way an order can be written: a page check alone is decoration.
--
-- Paid, shipped, delivered and cancelled orders never block anything. Only
-- `pending` does, so settling it either way — the money arrives, or she
-- cancels it and the stock goes back — frees them to order again.

create or replace function place_order(
  items jsonb,
  full_name text,
  phone text,
  city text,
  district text,
  address text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  new_order_id bigint;
  new_code text;
  sold_out text;
  outstanding text;
begin
  -- First, before any work: this is a fact about the buyer, not the cart.
  --
  -- The code travels in DETAIL because "you have an unpaid order" is not enough
  -- to act on when somebody cannot remember which one — the checkout page needs
  -- to name it and link to it.
  select o.code
  into outstanding
  from orders o
  where o.buyer_id = auth.uid()
    and o.status = 'pending'
  order by o.created_at
  limit 1;

  if outstanding is not null then
    raise exception 'unpaid_order_exists' using detail = outstanding;
  end if;

  -- One line per product, whatever shape the caller sent. The shop's own cart
  -- is keyed by product and cannot produce a duplicate, but this is a public
  -- endpoint and the caller writes the list: two lines of one each, against a
  -- stock of one, is an order for two. Merging first means every check below
  -- sees the real demand.
  select coalesce(
    jsonb_agg(jsonb_build_object('product_id', merged.product_id, 'quantity', merged.quantity)),
    '[]'::jsonb
  )
  into items
  from (
    select i.product_id, sum(i.quantity)::integer as quantity
    from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
    group by i.product_id
  ) merged;

  -- An order with no lines would be a row with a total of zero and nothing to
  -- ship. Refused here rather than left for the page to notice.
  if jsonb_array_length(items) = 0 then
    raise exception 'empty_order';
  end if;

  -- Every id has to name something. Left as a join, a missing product simply
  -- vanishes from the order — the line is dropped, the total shrinks, and
  -- nobody is told.
  if exists (
    select 1
    from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
    where not exists (select 1 from products p where p.id = i.product_id)
  ) then
    raise exception 'unknown_product';
  end if;

  -- Lock every product this order touches before looking at its stock, so a
  -- second order cannot slip between the reading and the spending. Ordered by
  -- id because two orders touching the same pair of products in opposite
  -- orders would otherwise wait on each other forever.
  perform 1
  from products p
  join jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
    on p.id = i.product_id
  order by p.id
  for update of p;

  -- What ran out, if anything. The name travels in DETAIL; the message stays a
  -- stable code for the app to match on rather than a Turkish sentence living
  -- in the database.
  select p.name
  into sold_out
  from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
  join products p on p.id = i.product_id
  where p.stock < i.quantity
  limit 1;

  if sold_out is not null then
    raise exception 'insufficient_stock' using detail = sold_out;
  end if;

  -- Stock first, and in the same transaction as the order below. Spending it
  -- before writing the order means a failure here leaves nothing behind.
  update products p
  set stock = p.stock - i.quantity
  from jsonb_to_recordset(items) as i(product_id bigint, quantity integer)
  where p.id = i.product_id;

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
