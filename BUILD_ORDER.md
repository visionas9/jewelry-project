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

---

## Next

### 1. Search & filter
- `?query=` and `?stone=` as URL state, read from `searchParams`
- Filtering runs in the database (`.ilike()`, `.eq()`), not over a JS array
- Filter UI + a "no results" state distinct from "catalog is empty"

### 2. Cart
- Zustand store, persisted to localStorage
- Quantity selector + "add to cart" on the detail page
- Cart page — items, quantity, remove, total
- Header badge (watch hydration: server renders 0, storage may say 3)

### 3. Accounts
- Supabase Auth — sign up, sign in, sign out
- `profiles` table keyed to `auth.users`, RLS so a user reads only their own row
- Google OAuth later, not now
- Account page — order history

### 4. Orders / checkout
- `orders` + `order_items` tables, RLS scoped to the buyer
- Checkout form with React Hook Form + Zod
- Server Action places the order — validates and re-checks stock on the server
- **Orders land in Supabase.** No email, no WhatsApp for v1: one place to look,
  nothing else to pay for or maintain. Email notification can come later.
- No payment processing in this project

### 5. Reviews
- Requires accounts first — otherwise it's a spam target
- `reviews` table, one row per user per product, RLS: write your own, read all
- Product score is the average of its rows, not a column on `products`

### 6. Polish
- Accessibility — focus states, labels, keyboard nav on the gallery
- Responsive audit at 375px
- `sitemap.ts`, `robots.ts`, JSON-LD product schema
- Image `sizes` accuracy, hero LCP

### 7. Ship
- Vercel deploy, env vars, domain
- Production check: RLS blocks writes, images load, Turkish glyphs render

---

## Working rules

- Never commit on `main`. Branch, then work.
- Claude builds; Alp reviews, opens the PR, merges.
