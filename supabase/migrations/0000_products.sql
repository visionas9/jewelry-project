-- The products table and its access policy.
--
-- Split out of the old supabase/schema.sql so the database can be rebuilt from
-- the migrations alone — `supabase db reset` replays this folder in order,
-- which is what the test suite runs against. Anything applied by hand in the
-- SQL editor is invisible to the tests, so it has to live here.

create table products (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  price       numeric(10,2) not null check (price >= 0),
  currency    text not null default 'TRY' check (currency in ('TRY')),
  category    text not null check (category in ('bileklik')),
  stone       text not null check (stone in ('kuvars','inci','lapis','rodonit','akik','turmalin')),
  description text not null,
  material    text not null,
  size        text not null,
  stock       integer not null default 0 check (stock >= 0),
  images      text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- Deny by default. The anon key is public, so the database is the only
-- place access can actually be enforced.
alter table products enable row level security;

-- Two separate gates, easily mistaken for one. GRANT decides whether a role
-- may touch the table at all; RLS then decides which rows it sees. Supabase's
-- default privileges hand anon no select/insert/update/delete, so without this
-- line the table is unreadable no matter how permissive the policy is.
--
-- Select only: the API has no business writing products, so the write verbs are
-- never granted and the missing policy below is a second lock on the same door.
grant select on products to anon, authenticated;

-- The catalog is public. Reads only — there is deliberately no insert,
-- update or delete policy, so the API cannot modify products.
create policy "products are publicly readable"
on products
for select
to anon, authenticated
using (true);
