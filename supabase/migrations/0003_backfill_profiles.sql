-- Profile rows for accounts that existed before profiles did.
--
-- The trigger on auth.users only fires for accounts created after it, so every
-- member who signed up earlier has no profile row at all. Nothing about that
-- announces itself: an UPDATE against a row that is not there succeeds and
-- changes nothing, so setting a display name looked like it worked and quietly
-- did not.
--
-- Safe to run more than once, and safe on a database where the trigger has been
-- doing its job all along — on conflict there is simply nothing to insert.
insert into profiles (id)
select id from auth.users
on conflict (id) do nothing;
