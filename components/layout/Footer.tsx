import Link from "next/link";
import { cacheLife } from "next/cache";

import { LEGAL_DOCUMENTS, legalHref } from "@/lib/legal";
import { SITE } from "@/lib/site";

// `use cache` because of the copyright year. Cache Components refuses to
// prerender a bare `new Date()` — the value would be frozen at build time
// with nothing saying when it should change. Caching it for a day makes that
// explicit: the year is allowed to be up to 24h stale, which for a copyright
// notice is fine.
export async function Footer() {
  "use cache";
  cacheLife("days");

  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted md:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-base lowercase tracking-[0.02em] text-ink">
            {SITE.name}
          </p>
          <p>{SITE.tagline}</p>
          <p>
            © {year} {SITE.name}
          </p>
        </div>

        <nav
          aria-label="Yasal bilgiler"
          className="mt-8 border-t border-line pt-6"
        >
          {/* One per line on a phone. Wrapped, these seven titles are long
              enough to break at different points on every row, which reads as
              a mistake rather than as a list. */}
          <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {LEGAL_DOCUMENTS.map((document) => (
              <li key={document.slug}>
                <Link
                  href={legalHref(document.slug)}
                  className="transition-colors hover:text-ink"
                >
                  {document.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
