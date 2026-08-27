-- Turkish-aware search column.
--
-- Two problems with plain `ilike` on name:
--   1. lower('İ') is 'i' + a combining dot, so a typed "inci" never matches
--      "İnci". Turkish dotted/dotless i does not fold the way lower() assumes.
--   2. Nobody types diacritics. "tas" should find "Taş", "dogal" → "Doğal".
--
-- Fixed by storing a normalised copy of the name and searching that instead.

create extension if not exists unaccent;

-- Map the Turkish i-pair onto ASCII BEFORE lower() sees them, then strip the
-- remaining diacritics (ş→s, ğ→g, ç→c, ö→o, ü→u).
--
-- Marked immutable so it can be used in a generated column. That is a promise
-- to Postgres: same input, same output, forever. Changing this function's
-- behaviour later means rebuilding the column.
create or replace function tr_normalize(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select unaccent('unaccent', lower(translate(value, 'İı', 'Ii')));
$$;

-- Generated: Postgres keeps it in sync on every insert and update. There is no
-- way for it to drift from `name`, which a trigger or app-side write could.
alter table products
  add column search_text text
  generated always as (tr_normalize(name)) stored;
