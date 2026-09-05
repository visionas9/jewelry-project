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
      {/* Hero — the photograph is the page, with the line laid over it.
          Full-bleed on purpose: `main` adds no padding of its own, so this
          runs edge to edge at every width. */}
      <section className="relative isolate flex min-h-[28rem] items-end overflow-hidden md:min-h-[36rem]">
        <Image
          src="/images/lapis-blue-1.jpg"
          alt="Lapis taşlı el yapımı bileklik"
          fill
          preload
          sizes="100vw"
          className="-z-10 object-cover"
        />

        {/* The photo is a bright one — white cloth, gold charms — so cream
            text needs something under it. Darkest at the bottom, where the
            words are, and close to clear at the top so the picture still
            reads as a picture. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/20"
        />

        <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-14 md:px-8 md:pt-32 md:pb-20">
          <h1 className="max-w-xl font-display text-4xl leading-[1.1] font-medium text-balance text-cream md:text-6xl">
            Her taşın kendi hikâyesi var
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-cream/85 md:text-lg">
            {SITE.description}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-cream px-7 py-3 text-sm tracking-wide text-ink transition-colors hover:bg-clay hover:text-cream"
          >
            Bilekliklere göz atın
          </Link>
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
