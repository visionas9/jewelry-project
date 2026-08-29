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
