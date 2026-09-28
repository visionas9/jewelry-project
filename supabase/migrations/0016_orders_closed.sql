-- The shop takes no orders until it can legally take money.
--
-- One row, one switch. Closed by default, so production is closed the moment
-- this lands; supabase/seed.sql opens it on the local stack only. Opening the
-- real shop is one line, on purpose — see docs/operations.md.

create table shop_settings (
  -- Always true, and the primary key: there can only ever be one row.
  only_row    boolean primary key default true check (only_row),
  orders_open boolean not null default false
);

insert into shop_settings default values;

-- Flipped by hand with the service role, never through the API. The hosted
-- project grants new tables to anon and authenticated by default.
alter table shop_settings enable row level security;
revoke all on shop_settings from anon, authenticated;
grant select, update on shop_settings to service_role;

-- Whether the shop is taking orders — the cart and checkout pages ask. The
-- answer is public; the table is not.
create function orders_open()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce((select orders_open from shop_settings), false);
$$;

revoke execute on function orders_open() from public;
grant execute on function orders_open() to anon, authenticated;

-- On every new order, however it was sent. Raised inside place_order's
-- transaction, so any stock it already took comes back.
create function refuse_orders_while_closed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not orders_open() then
    raise exception 'orders_closed';
  end if;

  return new;
end;
$$;

create trigger orders_only_while_open
before insert on orders
for each row
execute function refuse_orders_while_closed();
