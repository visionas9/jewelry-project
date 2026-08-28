import { cacheLife } from "next/cache";
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
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-base lowercase tracking-[0.02em] text-ink">
          {SITE.name}
        </p>
        <p>{SITE.tagline}</p>
        <p>
          © {year} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
