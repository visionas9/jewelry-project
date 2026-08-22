import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/site";

// No "use client" on purpose — this renders links and nothing else.
// It becomes a client component only when it needs state (the cart badge, Phase 5).
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-4 md:flex-row md:justify-between md:gap-8 md:px-8 md:py-5">
        <Link
          href="/"
          className="font-display text-2xl leading-none font-medium tracking-[0.15em] uppercase transition-colors hover:text-brass md:text-[1.6rem]"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Ana menü">
          <ul className="flex items-center gap-6 text-sm md:gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
