import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bileklikler",
  description: "El yapımı doğal taş bilekliklerin tamamı.",
};

export default function ProductsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">
        Bileklikler
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Ürün listesi Faz 3&apos;te buraya gelecek.
      </p>
    </section>
  );
}
