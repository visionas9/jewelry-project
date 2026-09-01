# ishin denshin

Turkish jewelry storefront — Next.js App Router, Supabase for the catalog,
deployed on Vercel.

## Development

```bash
npm install
npm run dev
```

The app reads its Supabase credentials from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Project settings

`supabase/config.toml` describes the hosted project as well as the local one.
The `[remotes.production]` block at the bottom holds the handful of values that
differ — the site URL, the redirect allow list, and the settings that are
deliberately relaxed for local testing — and everything else is shared.

```bash
supabase link --project-ref jgbzefpspppqwafexnen
supabase config push
```

Run it after changing anything under `[auth]`, including the email templates.
Nothing in the dashboard is picked up by this repo, so a value changed there
and not here is lost on the next push.

**Read before the first push.** This replaces the project's auth settings
rather than merging into them: whatever the dashboard holds and this file does
not describe is overwritten. Check the auth pages against this file once,
before the first run — after that the file is the source of truth and the
dashboard is a viewer.

The SMTP password is read from the shell rather than stored here, so it has to
be set for the push to carry it:

```bash
read -rs RESEND_SMTP_PASSWORD && export RESEND_SMTP_PASSWORD
supabase config push
```

`read -rs` waits for the Resend API key and echoes nothing, which keeps it out
of the shell history. Do not write the key on the `export` line: a placeholder
pasted verbatim is a valid password as far as the push is concerned, and it
will replace the working one without complaint. Auth email then fails silently
— Supabase accepts the config, and the mail simply never arrives.

It needs an access token, from `supabase login` or `SUPABASE_ACCESS_TOKEN`.
That token can change auth settings on the live project, which is why this is
a command someone runs on purpose rather than something CI does on a merge.

## The administrator

One person can see every order. That is a single row in `admins`, and it is
granted per environment rather than in a migration: user ids differ between the
local stack and the hosted project, and the account has to exist before it can
be named.

In the hosted project's SQL editor, or locally against `supabase start`:

```sql
insert into admins (id)
select id from auth.users where email = 'her@address';
```

To take it away, delete the row. Nothing else changes: the table is unreadable
and unwritable through the API, and `is_admin()` answers the question without
exposing who is on the list.

### The second factor

Admin access needs an authenticator code as well as a password. `is_admin()` is
false for a session that has not verified one, so a stolen password reads
nothing — the refusal is in the database, not in a page.

Enrol at `/admin/security`, which is reachable with a password alone. Everything
else in the panel is not. Enrol a second device while you are there: a lost
phone with only one factor means the SQL below.

If every device is lost, remove the factors with the service key and enrol
again:

```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'your@address');
```

## Auth emails and where their links point

The confirmation and reset emails build their link from the address the app
asks Supabase to send people back to, not from a hardcoded site. On a Vercel
preview that address is the branch's own URL, so a reset requested on a preview
can be finished on that same preview instead of bouncing to production.

Supabase only honours that address if it is on the project's redirect allow
list. Two entries are needed in the dashboard, under **Authentication → URL
Configuration → Redirect URLs**:

```
https://ishindenshinstore.com/**
https://ishin-denshin-git-*-visionas9s-projects.vercel.app/**
```

Without the matching entry Supabase quietly swaps in the project's Site URL,
which is the bare host with no path — the link keeps its token and lands on the
home page. `proxy.ts` catches that case and forwards it to the right route, so
a missing entry costs a wrong hostname rather than a broken account, but the
allow list is still the thing to fix.

The templates in `supabase/templates/` apply to the local stack only. The
hosted project keeps its own copies under **Authentication → Email Templates**,
and changing one here means pasting it there too.

## Database

`supabase/migrations/` is the schema — the single source of truth. Applying SQL
by hand in the dashboard is what the migrations exist to replace: anything not
in this folder is invisible to the test suite and will not survive a rebuild.

`supabase/seed.sql` holds the six bracelets, loaded on every local reset.

## Tests

The suite runs against a real local Postgres with the repo's migrations and
row-level-security policies applied. The Supabase client is not mocked on
purpose: access rules live in the database, so a mock would pass just as
happily with the policies missing.

One-time setup — the local stack runs in containers, so it needs a container
runtime ([Docker Desktop](https://docs.docker.com/desktop/) or
[OrbStack](https://orbstack.dev)) and the
[Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
brew install supabase/tap/supabase
```

Then, from a clean checkout:

```bash
supabase start
npm test
```

`npm test` rebuilds the test database first — it drops it, replays
`supabase/migrations/` in order, and loads the seed — so every run starts from
the same known rows. `supabase stop` shuts the stack down when you are done.
