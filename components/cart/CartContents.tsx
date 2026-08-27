"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCartHydrated, useCartStore } from "@/lib/stores/cart";
import type { Product } from "@/types/product";

// Takes the whole catalog from the server and matches it against the ids in the
// cart. Six products makes this the cheapest option — one cached query, no
// waterfall, and prices are always current. With thousands, this would have to
// become a lookup by the ids the cart actually holds.
export function CartContents({ products }: { products: Product[] }) {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Until localStorage is read, "empty" and "not loaded yet" look identical —
  // and showing the empty state first makes it flash for anyone with a cart.
  if (!hydrated) {
    return (
      <div aria-hidden="true" className="mt-10 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-sm bg-sand" />
        ))}
      </div>
    );
  }

  const lines = items.map((item) => ({
    item,
    product: products.find((p) => p.id === item.productId),
  }));

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-sm border border-line bg-sand px-6 py-14 text-center">
        <p className="font-display text-xl font-medium">Sepetin boş</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Beğendiğin bileklikleri buraya ekleyebilirsin.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Bileklikleri gör
        </Link>
      </div>
    );
  }

  const total = lines.reduce(
    (sum, { item, product }) =>
      product ? sum + product.price * item.quantity : sum,
    0
  );

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map(({ item, product }) => {
          // The product was removed from the catalog while it sat in someone's
          // cart. Say so plainly instead of rendering a blank row.
          if (!product) {
            return (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-4 py-5"
              >
                <p className="text-sm text-muted">
                  Bu ürün artık satışta değil.
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Kaldır
                </button>
              </li>
            );
          }

          const atStockLimit = item.quantity >= product.stock;

          return (
            <li key={item.productId} className="flex gap-4 py-5 sm:gap-6">
              <Link
                href={`/products/${product.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-sand sm:size-24"
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base leading-snug font-medium">
                    <Link
                      href={`/products/${product.slug}`}
                      className="transition-colors hover:text-brass"
                    >
                      {product.name}
                    </Link>
                  </h2>
                  <p className="shrink-0 text-sm tabular-nums">
                    {formatPrice(product.price * item.quantity, product.currency)}
                  </p>
                </div>

                <p className="text-xs text-muted">
                  Adet başına {formatPrice(product.price, product.currency)}
                </p>

                <div className="mt-1 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1, product.stock)
                      }
                      aria-label={`${product.name} adedini azalt`}
                      className="flex size-9 items-center justify-center rounded-full transition-colors hover:text-brass"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1, product.stock)
                      }
                      disabled={atStockLimit}
                      aria-label={`${product.name} adedini artır`}
                      className="flex size-9 items-center justify-center rounded-full transition-colors hover:text-brass disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    Kaldır
                  </button>
                </div>

                {atStockLimit ? (
                  <p className="text-xs text-muted">
                    Bu modelden stokta {product.stock} adet var.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-sm border border-line bg-sand px-6 py-6">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-medium">Toplam</p>
            <p className="text-lg tabular-nums">{formatPrice(total, "TRY")}</p>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            Kargo ücreti sipariş adımında hesaplanır.
          </p>

          {/* No checkout yet — orders and the form come next. A button that
              silently does nothing would be worse than an honest one. */}
          <button
            type="button"
            disabled
            className="mt-6 w-full rounded-full bg-line px-7 py-3 text-sm tracking-wide text-muted"
          >
            Sipariş adımı yakında
          </button>
        </div>
      </aside>
    </div>
  );
}
