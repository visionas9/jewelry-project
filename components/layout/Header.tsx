import Link from "next/link";
import { Suspense } from "react";

import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { CartBadge } from "@/components/cart/CartBadge";
import { NAV_LINKS, SITE } from "@/lib/site";

// Still no "use client". The cart badge and the auth link are each their own
// client island, so the header itself stays a server component and ships no JS
// of its own. Reading the session here instead would make every page on the
// site dynamic — the header is in the root layout, so there is no page it does
// not touch.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-4 md:flex-row md:justify-between md:gap-8 md:px-8 md:py-5">
        {/* The brand is always set lowercase. `lowercase` in the class list
            keeps it that way even if SITE.name ever arrives capitalised — this
            used to be `uppercase`, which would have rendered ISHIN DENSHIN. */}
        <Link
          href="/"
          className="font-display text-2xl leading-none font-medium lowercase tracking-[0.02em] transition-colors hover:text-brass md:text-[1.6rem]"
        >
          {SITE.name}
        </Link>

        <nav aria-label="Ana menü">
          <ul className="flex items-center gap-6 text-sm md:gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                  {link.href === "/cart" ? <CartBadge /> : null}
                </Link>
              </li>
            ))}

            {/* Last, and not part of NAV_LINKS: this slot is a sign-in link or
                an account link depending on who is looking, which is a runtime
                answer rather than a fixed piece of the menu.

                Behind a boundary because it reads the pathname, and on a route
                with a parameter in it there is no pathname to read while the
                shell is being built — the header would drag every such page out
                of its static shell, or refuse to build at all. The fallback is
                the same empty slot the component itself shows before it knows
                who is looking, so nothing moves when it arrives. */}
            <li>
              <Suspense fallback={<AuthSlotPlaceholder />}>
                <HeaderAuth />
              </Suspense>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// Holds the width of the longer of the two labels, exactly as HeaderAuth does,
// so the nav does not shift when the real slot replaces this one.
function AuthSlotPlaceholder() {
  return (
    <span className="grid justify-items-start">
      <span aria-hidden className="invisible col-start-1 row-start-1">
        Giriş Yap
      </span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        Hesabım
      </span>
    </span>
  );
}
