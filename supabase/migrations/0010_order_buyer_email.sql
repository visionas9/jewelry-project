-- The buyer's account email, for the one page that shows a whole order.
--
-- order_items and orders are already the administrator's to read through RLS,
-- but the email is not on them — it is in auth.users, which no anon-key client
-- may touch. SECURITY DEFINER bridges exactly that one field, and nothing else:
-- it answers only for the administrator, only with a second factor, and only
-- ever the email of the person who placed the named order.

create function order_buyer_email(order_code text)
returns text
language plpgsql
security definer
-- Pinned so a definer function cannot be steered through the caller's
-- search_path, same as every other function here.
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  buyer_email text;
begin
  -- is_admin() is the account *and* aal2. A stolen password reads no email
  -- here any more than it reads an order.
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  select u.email
  into buyer_email
  from orders o
  join auth.users u on u.id = o.buyer_id
  where o.code = order_code;

  if not found then
    raise exception 'unknown_order';
  end if;

  return buyer_email;
end;
$$;

-- Postgres hands EXECUTE to PUBLIC by default; take it back and give it only to
-- signed-in callers, where is_admin() then does the real deciding.
revoke execute on function order_buyer_email(text) from public;
grant execute on function order_buyer_email(text) to authenticated;
