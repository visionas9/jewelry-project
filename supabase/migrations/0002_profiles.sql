-- One profile row per member.
--
-- Deliberately holds no role, tier or permission column. Members can update
-- their own row to set a display name, so any privilege column sitting on that
-- row would be self-service promotion. Administrator identity is established
-- separately, against a fixed uuid.

create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Reads are all-or-nothing at the table level; the policy below narrows them to
-- one row. Writes are granted per column, so `display_name` is the only thing a
-- member can change — `id` is not writable at all, which stops anyone rewriting
-- their row to point at somebody else's account.
grant select on profiles to authenticated;
grant update (display_name) on profiles to authenticated;

-- Nothing is granted to anon. A signed-out visitor cannot reach this table.

-- auth.uid() is the id from the request's JWT. Matching on it rather than on an
-- email is the difference between a claim the database verified and a string
-- the client supplied.
create policy "members read their own profile"
on profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- USING picks the rows this member may update; WITH CHECK re-tests the row
-- afterwards. Both are needed: without WITH CHECK an update could move a row
-- out of the member's own reach.
create policy "members update their own profile"
on profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- The profile row appears the moment the account does, so no code path has to
-- remember to create one and no account can exist without a profile.
--
-- security definer because the inserting session is the brand-new user, who has
-- no insert privilege here. search_path is pinned empty and every name written
-- out in full: a definer function that resolves names loosely can be hijacked
-- by anything that shadows them.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();
