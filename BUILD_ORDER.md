# BUILD_ORDER.md — Jewelry Project

Working plan for the build. Claude Code: read this alongside CLAUDE.md.
The 🟢/🔵/🟡 tags say who does each step — respect them, especially 🔵.

Legend:
- 🟢 **CLAUDE CODE (fast)** — plumbing, you build it directly.
- 🔵 **ALP (concept)** — Alp writes it himself. You guide + review only, never write it.
- 🟡 **BOTH** — Alp does the logic, you do the layout/UI.

---

## PHASE 0 — Setup ✅ DONE
- Next.js project created (TS, Tailwind, App Router, `@/`)
- Zustand installed
- CLAUDE.md in root
- Matt Pocock skills installed + `/setup-matt-pocock-skills` run
- Photos in `/public/images` (named per product: `lapis-blue-1.jpg`, etc.)

---

## PHASE 1 — Foundations 🟢 (next)
1. Folder structure: `/app`, `/components`, `/lib`, `/lib/stores`, `/data`, `/types`.
2. Root layout + global styles — calm/elegant look (natural light, soft, minimal).
3. Routing: home `/`, `/products`, `/products/[slug]`, `/cart`.
4. Header + nav (links only for now).

---

## PHASE 2 — Data & Types 🔵
5. Decide: keep product text Turkish, or translate to EN/PL. (Alp's product call)
6. Convert the Excel data → a TS/JSON file in `/data`.
7. **Model the `Product` type** — name, price, currency, category, description,
   material, size, stock, slug, image(s). No `any`. (Alp writes)
8. Type the data array against it, fix mismatches.

Product image naming already in place:
lapis-blue, rose-quartz, green-sun, rhodonite-rose, pearl-leaf, luna-turmalin
(each `-1/-2/-3.jpg`; rose-quartz has only `-1`).

---

## PHASE 3 — Product Display 🟡
9.  **Product store (Zustand)** — holds products, seeded from data. 🔵
10. Product list page — grid of cards. (Alp: store wiring · CC: card layout)
11. Product detail `[slug]` — one product, image gallery, details. 🟡
12. **`useSelectedProduct`** helper — find product by slug. 🔵
13. Loading / empty states for the list. 🔵

---

## PHASE 4 — Search & Filter 🔵
14. **Search bar** — controlled input, debounced, updates URL `?query=`.
15. **Filtering logic** — by category + search term.
16. Category filter links (`?category=`).
17. Empty state: "no products match." 🔵

---

## PHASE 5 — Cart 🟡
18. **Cart store (Zustand)** — separate file. add / remove / update qty. 🔵
19. Quantity selector on product page (local state) + "Add to cart." 🔵
20. Decide add-vs-set behavior. (Alp's product call) 🔵
21. Cart page — items, change qty, remove, total. 🟡
22. Cart badge in header (item count). 🟡
23. **Persist cart to localStorage** (Zustand `persist`). 🔵

---

## PHASE 6 — Forms 🔵
24. Install React Hook Form + Zod.
25. **A real form** (checkout or contact) — RHF + Zod schema.
26. Validation + error display; one schema validates AND types the data. 🔵

---

## PHASE 7 — Supabase (real backend) 🔵
27. Set up Supabase project, connect. 🟢
28. **Design the schema** — products table (orders later). (Alp models)
29. Move products from data file → the database. 🔵
30. **Fetch products in a server component** (no useEffect). 🔵
31. **Row Level Security** — write policies myself, test them. 🔵
32. (Optional) **A Server Action or Route Handler** — e.g. submit an order. 🔵

---

## PHASE 8 — Polish 🟡
33. Loading / error / empty states EVERYWHERE — audit every data call. 🔵
34. `loading.tsx` + `error.tsx` + `notFound()` on the right routes. 🔵
35. `next/image` for all product photos, proper sizing. 🟢
36. Metadata / SEO per page. 🟢
37. Mobile-first responsive pass — check every page at phone width. 🟡
38. Accessibility quick pass — keyboard nav, labels, focus states. 🟡

---

## PHASE 9 — Ship 🟢
39. Deploy to Vercel — env vars, connect Supabase.
40. Test the live URL end to end.
41. **Write a "why I built it this way" README** — decisions, tradeoffs. 🔵

---

## Reminder
Anything 🔵, and the logic half of 🟡 — Alp writes it. If it fogs him, stop
and make him rebuild it until it's his. Go fast on 🟢 and the layout half of 🟡.
