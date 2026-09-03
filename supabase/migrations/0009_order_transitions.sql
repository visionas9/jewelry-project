-- Moving an order along.
--
-- Four functions, one per step she actually takes: the money arrived, the
-- parcel went to the courier, it landed, or it never happened. Each does the
-- whole change in one transaction, for the same reason place_order does — a
-- cancellation that sets the status but forgets the stock would leave a
-- bracelet unsellable and nobody looking for it.
--
-- The API is granted no write privileges on orders, so these are the only way
-- the status can ever move.

alter table orders
  add column paid_at        timestamptz,
  add column shipped_at     timestamptz,
  add column delivered_at   timestamptz,
  add column cancelled_at   timestamptz,
  add column carrier        text,
  add column tracking_number text;

-- The guard and the lock, in one place.
--
-- Every function below starts here: refuse anyone who is not the administrator,
-- then take the row and hold it until the transaction ends. The lock is what
-- makes cancelling twice at once impossible — the second call waits, then sees
-- the status the first one wrote rather than the one it read a moment ago.
--
-- Not granted to anybody: it is called by the definer functions below, which
-- run as the owner. There is nothing here for a browser to reach.
create function admin_order_for_update(order_code text)
returns orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  found_order orders;
begin
  -- is_admin() is the account *and* a verified second factor. A stolen
  -- password cannot move an order any more than it can read one.
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  select * into found_order from orders where code = order_code for update;

  if not found then
    raise exception 'unknown_order';
  end if;

  return found_order;
end;
$$;

revoke execute on function admin_order_for_update(text) from public;

-- The money arrived. pending → paid.
create function mark_paid(order_code text)
returns order_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  current_order orders;
begin
  current_order := admin_order_for_update(order_code);

  -- Already there. Two clicks on one button is not a mistake worth an error,
  -- and the second must not move the timestamp the first one wrote.
  if current_order.status = 'paid' then
    return current_order.status;
  end if;

  if current_order.status <> 'pending' then
    -- A stable code, like insufficient_stock: the app matches on the message
    -- and writes the Turkish itself. Where it actually was travels in DETAIL.
    raise exception 'invalid_transition' using detail = current_order.status::text;
  end if;

  update orders set status = 'paid', paid_at = now() where id = current_order.id;

  return 'paid';
end;
$$;

-- Handed to the courier. paid → shipped, and the tracking the buyer will ask
-- for is written in the same statement as the status.
create function mark_shipped(order_code text, carrier text, tracking_number text)
returns order_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  current_order orders;
begin
  current_order := admin_order_for_update(order_code);

  if current_order.status = 'shipped' then
    return current_order.status;
  end if;

  if current_order.status <> 'paid' then
    raise exception 'invalid_transition' using detail = current_order.status::text;
  end if;

  -- Shipped without a tracking number is a state the buyer cannot be told
  -- anything useful about. Refused here rather than saved and noticed later.
  if coalesce(btrim(carrier), '') = '' or coalesce(btrim(tracking_number), '') = '' then
    raise exception 'missing_tracking';
  end if;

  update orders
  set status = 'shipped',
      shipped_at = now(),
      carrier = btrim(carrier),
      tracking_number = btrim(tracking_number)
  where id = current_order.id;

  return 'shipped';
end;
$$;

-- It arrived. shipped → delivered.
create function mark_delivered(order_code text)
returns order_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  current_order orders;
begin
  current_order := admin_order_for_update(order_code);

  if current_order.status = 'delivered' then
    return current_order.status;
  end if;

  if current_order.status <> 'shipped' then
    raise exception 'invalid_transition' using detail = current_order.status::text;
  end if;

  update orders set status = 'delivered', delivered_at = now() where id = current_order.id;

  return 'delivered';
end;
$$;

-- The transfer never came, or it was called off.
--
-- The mirror image of place_order: the stock that order took goes back on the
-- shelf in the same transaction that cancels it. Only from pending or paid —
-- once a parcel is with the courier, its stock is gone whatever happens next,
-- and putting it back would sell a bracelet that is in somebody's hallway.
create function cancel_order(order_code text)
returns order_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  current_order orders;
begin
  current_order := admin_order_for_update(order_code);

  -- Already cancelled: nothing to do, and above all no second helping of
  -- stock. The row lock above is what makes this reliable under two clicks.
  if current_order.status = 'cancelled' then
    return current_order.status;
  end if;

  if current_order.status not in ('pending', 'paid') then
    raise exception 'invalid_transition' using detail = current_order.status::text;
  end if;

  -- Lock the products before adding to them, in id order, for the same reason
  -- place_order does when spending: two transactions touching the same pair in
  -- opposite orders would otherwise wait on each other forever.
  perform 1
  from products p
  where p.id in (select oi.product_id from order_items oi where oi.order_id = current_order.id)
  order by p.id
  for update of p;

  -- Grouped, because an order may hold two lines of the same product.
  update products p
  set stock = p.stock + returning_lines.quantity
  from (
    select oi.product_id, sum(oi.quantity)::integer as quantity
    from order_items oi
    where oi.order_id = current_order.id
    group by oi.product_id
  ) returning_lines
  where p.id = returning_lines.product_id;

  update orders set status = 'cancelled', cancelled_at = now() where id = current_order.id;

  return 'cancelled';
end;
$$;

-- Postgres hands EXECUTE on a new function to PUBLIC, which here is the anon
-- key a browser carries. Signed-out callers are turned away at the door rather
-- than inside the body.
revoke execute on function mark_paid(text) from public;
revoke execute on function mark_shipped(text, text, text) from public;
revoke execute on function mark_delivered(text) from public;
revoke execute on function cancel_order(text) from public;

grant execute on function mark_paid(text) to authenticated;
grant execute on function mark_shipped(text, text, text) to authenticated;
grant execute on function mark_delivered(text) to authenticated;
grant execute on function cancel_order(text) to authenticated;
