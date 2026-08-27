import type { Metadata } from "next";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";

export const metadata: Metadata = {
  title: "Bileklikler",
  description: "El yapımı doğal taş bilekliklerin tamamı.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">
        Bileklikler
      </h1>

      {products.length === 0 ? (
        // The table is reachable but empty — not an error, just nothing to show.
        <div className="mt-10 rounded-sm border border-line bg-sand px-6 py-14 text-center">
          <p className="font-display text-xl font-medium">
            Şu anda görüntülenecek bileklik yok
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Yeni modeller hazırlanıyor. Kısa süre içinde burada olacaklar.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted">{products.length} ürün</p>

          <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
