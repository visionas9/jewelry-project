import { ProductDetailSkeleton } from "@/components/products/ProductDetailSkeleton";

// The list skeleton in ../loading.tsx would otherwise cover this route too —
// a six-card grid flashing before a single product. Nearest loading.tsx wins.
export default function ProductDetailLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <ProductDetailSkeleton />
      <span className="sr-only">Ürün yükleniyor…</span>
    </section>
  );
}
