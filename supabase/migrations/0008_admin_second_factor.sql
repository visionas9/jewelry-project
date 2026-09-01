-- A password alone is not enough to run the shop.
--
-- Two questions, deliberately separate:
--
--   is_admin_account()  is this the administrator's account?
--   is_admin()          ...and did this session pass a second factor?
--
-- Everything that reads or changes orders asks the second. Only the page where
-- a factor is enrolled asks the first — otherwise the one administrator would
-- be locked out of the page that fixes a lost phone.

create function is_admin_account()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from admins where id = (select auth.uid()));
$$;

revoke execute on function is_admin_account() from public;
grant execute on function is_admin_account() to authenticated;

-- aal2 is the claim Supabase adds once a second factor has been verified. A
-- stolen password produces a perfectly valid session that this returns false
-- for, and the refusal happens here rather than in a page.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select is_admin_account()
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;
