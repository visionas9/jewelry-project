# BUILD_ORDER.md — Jewelry Project

Roadmap for the build. Read alongside CLAUDE.md.

**What this is:** a Next.js (App Router) + TypeScript + Tailwind storefront for a
family jewelry business — handmade natural-stone bracelets. Data lives in Supabase.
Turkish only; the customers are Turkish.

---

## Done

**Setup** — Next.js + TS + Tailwind + Zustand, `@/` alias, product photos in
`/public/images`.

**Layout & routing** — root layout, header, footer, home page. Routes: `/`,
`/products`, `/products/[slug]`, `/cart`.

**Product display** — product grid, product detail page with sticky gallery,
per-product metadata and OG tags.

**Database** — Supabase `products` table with check constraints and RLS
(public read, no writes). Schema and seed data in [`/supabase`](./supabase).

**Data layer** — [`lib/products.ts`](./lib/products.ts) holds every product query.
Pages are server components that `await` it. Cached with `use cache` +
`cacheLife('days')`, tagged `products` for on-demand invalidation later.

**States** — `loading.tsx` skeleton, `error.tsx` with retry, `not-found.tsx`,
and an empty-catalog state on the list page.

**Search & filter** — `?query=` and `?stone=` as URL state. Filtering runs in
Postgres. Turkish-aware search via a normalised `search_text` column, so "inci"
finds "İnci" and "tas" finds "Taş".

**Cart** — Zustand store persisted to localStorage, holding only
`{ productId, quantity }` so prices are never stale. Quantity selector on the
detail page, cart page with line totals, header badge.

---

## State: what lives where

- **URL** — filters. They describe the page, so they have to be shareable.
- **Zustand + localStorage** — the cart. It describes the visitor, not the page.
- **Postgres** — products. The one source of truth for price and stock.

---

## Next

### 1. Accounts
- Supabase Auth — sign up, sign in, sign out
- `profiles` table keyed to `auth.users`, RLS so a user reads only their own row
- Google OAuth later, not now
- Account page — order history

### 2. Orders / checkout
- `orders` + `order_items` tables, RLS scoped to the buyer
- Checkout form with React Hook Form + Zod
- Server Action places the order — validates and re-checks stock on the server
- **Orders land in Supabase.** No email, no WhatsApp for v1: one place to look,
  nothing else to pay for or maintain. Email notification can come later.
- No payment processing in this project

### 3. Reviews
- Requires accounts first — otherwise it's a spam target
- `reviews` table, one row per user per product, RLS: write your own, read all
- Product score is the average of its rows, not a column on `products`

### 4. Polish
- Accessibility — focus states, labels, keyboard nav on the gallery
- Responsive audit at 375px
- `sitemap.ts`, `robots.ts`, JSON-LD product schema
- Image `sizes` accuracy, hero LCP

### 5. Ship
- Vercel deploy, env vars, domain
- Production check: RLS blocks writes, images load, Turkish glyphs render

---

## Working rules

- Never commit on `main`. Branch, then work.
- Claude builds; Alp reviews, opens the PR, merges.
