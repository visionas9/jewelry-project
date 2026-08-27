"use client";

import Link from "next/link";

// The parent error.tsx says "Bileklikler yüklenemedi" — plural, written for the
// list. On a single product that's the wrong sentence, so this one takes over.
export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl font-medium md:text-4xl">
        Bu bileklik yüklenemedi
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Ürün bilgileri getirilirken bir sorun oldu. Tekrar denemek yeterli
        olabilir.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Tekrar dene
        </button>

        {/* A way out if retrying keeps failing. */}
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-full border border-line px-7 py-3 text-sm tracking-wide transition-colors hover:border-ink"
        >
          Tüm bileklikler
        </Link>
      </div>

      {/* The digest is how you find this exact error in the server logs. */}
      {error.digest ? (
        <p className="mt-6 text-xs text-muted">Hata kodu: {error.digest}</p>
      ) : null}
    </section>
  );
}
