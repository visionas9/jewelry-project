"use client";

// Catches anything thrown while rendering /products — most likely the database
// being unreachable. `reset` re-renders the segment without a full page reload.
export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl font-medium md:text-4xl">
        Bileklikleri getiremedik
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Bağlantıda küçük bir aksilik oldu. Bir kez daha denersen büyük
        ihtimalle düzelir.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
      >
        Tekrar dene
      </button>

      {/* The digest is how you find this exact error in the server logs. */}
      {error.digest ? (
        <p className="mt-6 text-xs text-muted">Hata kodu: {error.digest}</p>
      ) : null}
    </section>
  );
}
