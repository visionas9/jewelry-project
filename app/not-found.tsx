import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: false },
};

// The site's own 404. Without this Next renders its built-in one, which brings
// its own stylesheet — including a dark-mode rule that paints the body black
// and stays there through client-side navigation, until a reload.
//
// It is also what a stranger sees at /admin, so it says nothing about what
// might have been there.
export default function NotFound() {
  return (
    <section className="mx-auto max-w-md px-5 py-20 text-center md:px-8 md:py-28">
      <h1 className="font-display text-3xl md:text-4xl">Sayfa bulunamadı</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Aradığınız sayfa taşınmış ya da adreste küçük bir yazım hatası olabilir.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Bilekliklere göz at
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink"
        >
          Ana sayfa
        </Link>
      </div>
    </section>
  );
}
