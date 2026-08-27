// Shown while the products page renders. Mirrors the real grid's shape so the
// layout doesn't jump when the content swaps in.
export default function ProductsLoading() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <div className="h-10 w-64 animate-pulse rounded-sm bg-sand md:h-12" />
      <div className="mt-4 h-4 w-20 animate-pulse rounded-sm bg-sand" />

      <ul
        aria-hidden="true"
        className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-sm bg-sand" />
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="h-5 w-2/3 animate-pulse rounded-sm bg-sand" />
              <div className="h-4 w-16 shrink-0 animate-pulse rounded-sm bg-sand" />
            </div>
          </li>
        ))}
      </ul>

      <span className="sr-only">Bileklikler yükleniyor…</span>
    </section>
  );
}
