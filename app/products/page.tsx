import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getFilteredProducts } from "@/lib/products";
import { isStone, stoneLabel } from "@/lib/stones";
import type { Stone } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";

export const metadata: Metadata = {
  title: "Bileklikler",
  description: "Elde dizilen doğal taş bilekliklerin hepsi burada.",
};

// The heading is the same for every visitor, so it stays in the static shell.
// Everything that depends on the URL sits behind its own Suspense boundary.
export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">
        Bileklikler
      </h1>

      {/* Its own boundary, separate from the results: the input keeps focus
          while a search is in flight instead of unmounting on every keystroke. */}
      <Suspense fallback={<FiltersFallback />}>
        <ProductFilters />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductResults searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function ProductResults({
  searchParams,
}: {
  searchParams: PageProps<"/products">["searchParams"];
}) {
  const { query, stone } = await searchParams;

  // A param can arrive as an array if it's repeated in the URL, and `stone`
  // could be anything at all. Narrow both before they reach the database.
  const searchTerm = typeof query === "string" ? query.trim() : "";
  const activeStone = isStone(stone) ? stone : undefined;

  const products = await getFilteredProducts({
    query: searchTerm || undefined,
    stone: activeStone,
  });

  const isFiltered = searchTerm !== "" || activeStone !== undefined;

  if (products.length === 0) {
    return isFiltered ? (
      <EmptyState
        title="Aradığınıza uygun bir bileklik bulunamadı"
        body={describeFilters(searchTerm, activeStone)}
        action={
          <Link
            href="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay"
          >
            Hepsini göster
          </Link>
        }
      />
    ) : (
      // No filters and still nothing — the catalog itself is empty.
      <EmptyState
        title="Vitrin şu an boş"
        body="Yeni modeller atölyede hazırlanıyor. Çok yakında buradalar."
      />
    );
  }

  return (
    <>
      <p className="mt-8 text-sm text-muted" aria-live="polite">
        {products.length} bileklik
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </>
  );
}

// "Lapis" / "“mavi”" / "“mavi” · Lapis" — echo back what was actually searched
// so the empty state names the filters instead of just saying "nothing found".
function describeFilters(searchTerm: string, activeStone: Stone | undefined) {
  const parts: string[] = [];
  if (searchTerm) parts.push(`“${searchTerm}”`);
  if (activeStone) parts.push(stoneLabel(activeStone));

  return `${parts.join(" · ")} için bir şey bulamadık. Başka bir kelime ya da taş denemeye ne dersin?`;
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-sand px-6 py-14 text-center">
      <p className="font-display text-xl font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {body}
      </p>
      {action}
    </div>
  );
}

function FiltersFallback() {
  return (
    <div aria-hidden="true" className="mt-8 flex flex-col gap-5">
      <div className="h-12 w-full max-w-sm animate-pulse rounded-full bg-sand" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-sand" />
        ))}
      </div>
    </div>
  );
}
