import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { getProducts } from "@/lib/products";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* Hero — stacked on phones, two columns from md up. No search box: the
          shop is small enough that the whole shelf sits below this, and a
          search field above a complete catalogue is a question nobody needed
          to be asked. */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div className="flex flex-col items-start gap-6">
            <p className="text-xs tracking-[0.25em] text-clay uppercase">
              El emeği · Gerçek taş
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-medium text-balance md:text-6xl">
              Her taşın kendi hikâyesi var
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted md:text-lg">
              {SITE.description}
            </p>
            <Link
              href="/products"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-clay px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-ink"
            >
              Bilekliklere göz atın
            </Link>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand md:aspect-[3/4]">
            <Image
              src="/images/lapis-blue-1.jpg"
              alt="Lapis taşlı el yapımı bileklik"
              fill
              preload
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* The whole shelf, right here. With this few models, sending somebody to
          a separate page to see six bracelets is a click that buys nothing —
          /products still exists for filtering and for links already shared. */}
      <section className="border-t border-line bg-sand/40">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-medium md:text-3xl">
              Bileklikler
            </h2>
            <Link
              href="/products"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Filtrele →
            </Link>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <AllProducts />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function AllProducts() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
        Yeni modeller atölyede hazırlanıyor. Çok yakında burada olacaklar.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.slug}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
