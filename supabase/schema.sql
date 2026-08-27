-- Schema for the Supabase project. Run in order, in the SQL Editor.
-- Kept in the repo so the database can be rebuilt from scratch.

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

-- The catalog is public. Reads only — there is deliberately no insert,
-- update or delete policy, so the API cannot modify products.
create policy "products are publicly readable"
on products
for select
to anon, authenticated
using (true);

-- Applied by migrations/0001_search_text.sql. Kept here so a rebuild from this
-- file alone produces the same table.
create extension if not exists unaccent;

create or replace function tr_normalize(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select unaccent('unaccent', lower(translate(value, 'İı', 'Ii')));
$$;

alter table products
  add column search_text text
  generated always as (tr_normalize(name)) stored;
