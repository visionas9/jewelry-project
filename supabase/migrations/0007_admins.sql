-- The shop's one administrator.
--
-- A table rather than a column on profiles: a member can update their own
-- profile row, so any privilege living there would be self-service promotion.
-- Nothing is granted on this table to anon or authenticated, so it cannot be
-- read, listed or written through the API at all.

create table admins (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- The service role writes it. That key never reaches a browser, and granting
-- admin is a deliberate one-off in each environment — see README.
grant select, insert, delete on admins to service_role;

-- Whether the caller is the administrator.
--
-- SECURITY DEFINER so the check works without granting anybody sight of the
-- table: the answer is available, the membership list is not. STABLE so it is
-- evaluated once per statement rather than per row when policies use it.
create function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from admins where id = (select auth.uid()));
$$;

revoke execute on function is_admin() from public;
grant execute on function is_admin() to authenticated;

-- Every order, and every line, for the one person who runs the shop. Separate
-- policies rather than widening the members' ones: what a member may see is
-- worth being able to read on its own.
create policy "the administrator reads every order"
on orders
for select
to authenticated
using (is_admin());

create policy "the administrator reads every line"
on order_items
for select
to authenticated
using (is_admin());
