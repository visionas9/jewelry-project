import Link from "next/link";

// Covers /products/[slug] with a slug that isn't in the database.
export default function ProductNotFound() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl font-medium md:text-4xl">
        Bu bileklik bulunamadı
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Aradığın model kaldırılmış ya da adres yanlış olabilir.
      </p>

      <Link
        href="/products"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
      >
        Tüm bilekliklere dön
      </Link>
    </section>
  );
}
