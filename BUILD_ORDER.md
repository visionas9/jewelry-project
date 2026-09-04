# BUILD_ORDER.md — ishin denshin

What this project is, what got built, and what was deliberately left out.
Read alongside CLAUDE.md.

**What this is:** a Next.js (App Router) + TypeScript + Tailwind storefront for a
family jewelry business — handmade natural-stone bracelets. Data lives in
Supabase. Turkish only; the customers are Turkish.

**The shape of it:** the shop is run by one person from her phone. That is the
constraint behind most of the decisions below — the admin panel exists so she
never opens Supabase Studio, and every panel screen is designed to be usable
one-handed.

---

## Done

**Setup** — Next.js + TS + Tailwind + Zustand, `@/` alias, product photos in
`/public/images`.

**Layout & routing** — root layout, header, footer, home page, a real 404.

**Product display** — product grid, detail page with sticky gallery, per-product
metadata and OG tags.

**Search & filter** — `?query=` and `?stone=` as URL state, filtering in
Postgres. Turkish-aware via a normalised `search_text` column, so "inci" finds
"İnci".

**Cart** — Zustand persisted to localStorage, holding only
`{ productId, quantity }` so prices are never stale.

**Accounts** — Supabase Auth: sign up, sign in, sign out, password reset.
`profiles` keyed to `auth.users`, RLS so a member reads only their own row.
Account page with order history.

**Checkout** — `orders` + `order_items`, written **only** by the `place_order`
Postgres function: what makes an order correct (today's price, stock that is
actually there) cannot be decided by the caller, so the API is granted no write
privileges at all. Havale/EFT only — no payment processing.

**One unpaid order at a time** — `place_order` refuses a second pending order and
names the outstanding code, so checkout can link to it. The shop is bank
transfer only; three pending orders would be three codes against one transfer.

**Order emails** — confirmation at checkout (to the buyer and to the shop), then
*Ödendi*, *Kargolandı* and *Teslim edildi* to the buyer as she moves it along.
Sent after the change is committed, never able to fail it, logged instead of
sent when there is no `RESEND_API_KEY`.

**Admin panel** — `/admin`, hidden behind a 404 for everybody else and never
linked. Order list with filter and search, single-order page, and the four state
changes (`mark_paid`, `mark_shipped`, `mark_delivered`, `cancel_order`), each one
transaction, with cancelling returning stock exactly once. Courier picked from a
fixed list. Second factor required.

**Blog** — `/blog`, written by her from `/admin/blog`. Posts in Postgres, cover
images in Supabase Storage, slug generated once from the title and never changed.

**Analytics** — Vercel Web Analytics. Cookieless, so no consent banner.

---

## How access is decided

Three independent layers, because the cost of a leak is somebody's address and
phone number:

1. **`proxy.ts`** — turns away anyone who is not the administrator before a page
   renders, with a 404 rather than a redirect: the route does not admit it
   exists.
2. **The page's own guard** — `requireVerifiedAdmin()`, in case a route is
   reached some way the proxy did not expect.
3. **Row Level Security** — the database returns nothing and refuses every write
   regardless of what any page decides.

`is_admin()` means *on the `admins` list* **and** `aal2`, so a stolen password
reads nothing. `is_admin_account()` is the identity half alone and guards only
`/admin/security`, which must stay reachable with a password or a lost phone
locks the one administrator out of the page that fixes it.

---

## State: what lives where

- **URL** — filters, search, admin list state. They describe the page, so they
  have to be shareable and survive a refresh.
- **Zustand + localStorage** — the cart. It describes the visitor, not the page.
- **Cookies** — the session, refreshed in `proxy.ts` so no page has to think
  about expiry.
- **Postgres** — products, orders, posts. The one source of truth for anything
  that must not be decided by a browser.

---

## Deliberately not built

Each of these was considered and left out on purpose. None is an oversight.

- **Comments on blog posts** — a new table, moderation UI, and spam handling, all
  of it dead weight with no traffic. Revisit when there are people to comment.
- **Reviews** — same reasoning, and it needs traffic to mean anything.
- **Payment processing** — havale/EFT is what the shop actually uses.
- **Draft posts** — she writes a post and publishes it; a draft state is a column
  and a filter earning nothing yet.
- **Auto-expiring unpaid orders** — would need a scheduled job. Hilal cancelling
  from the panel already returns the stock and unblocks the buyer.
- **Backward order transitions** — you cannot un-ship. Cancelling is the one
  correction, and it only applies before a parcel is with the courier.

---

## Operating it

- **Migrations are not automatic.** After merging anything under
  `supabase/migrations`, run `supabase db push` against production yourself.
- **Env vars live in Vercel.** `ORDER_EMAIL` must point at a real inbox — the
  fallback address can send but not receive.
- **Granting admin is a deliberate one-off per environment** — one row in
  `admins`, written with the service role key. See README.

---

## Working rules

- Never commit on `main`. Branch, then work.
- Small commits as the work lands, not one commit at PR time.
- Test-first for server rules — anything in Postgres, anything about who may do
  what. Not for layout.
- Claude branches, commits, pushes and opens the PR; Alp reviews and merges.
