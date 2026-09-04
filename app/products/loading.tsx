import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

// Covers /products. The detail route has its own loading.tsx — the nearest one
// to a segment wins.
export default function ProductsLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-sand md:h-12" />
      <div className="mt-8 h-12 w-full max-w-sm animate-pulse rounded-full bg-sand" />
      <ProductGridSkeleton />
      <span className="sr-only">Bileklikler yükleniyor…</span>
    </section>
  );
}
