import Link from "next/link";
import { Suspense } from "react";

import { HeaderAuth, AuthIconPlaceholder } from "@/components/auth/HeaderAuth";
import { CartIcon } from "@/components/cart/CartIcon";
import { NavMenu } from "@/components/layout/NavMenu";
import { NAV_LINKS, SITE } from "@/lib/site";

// Still no "use client". The menu, the cart and the account link are each their
// own client island, so the header itself stays a server component and ships no
// JS of its own. Reading the session here instead would make every page on the
// site dynamic — the header is in the root layout, so there is no page it does
// not touch.
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-sm">
      {/* Three columns rather than a flex row, so the brand is centred against
          the bar itself and not against whatever the two sides happen to
          weigh. `relative` is what the menu panel hangs from. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-4 md:gap-4 md:px-8 md:py-5">
        <div className="flex justify-start">
          <NavMenu links={NAV_LINKS} />
        </div>

        {/* The brand is always set lowercase. `lowercase` in the class list
            keeps it that way even if SITE.name ever arrives capitalised — this
            used to be `uppercase`, which would have rendered ISHIN DENSHIN. */}
        <Link
          href="/"
          className="font-display text-xl leading-none font-medium lowercase tracking-[0.02em] transition-colors hover:text-clay sm:text-2xl md:text-[1.6rem]"
        >
          {SITE.name}
        </Link>

        <div className="flex items-center justify-end">
          <CartIcon />

          {/* Behind a boundary because it reads the pathname, and on a route
              with a parameter in it there is no pathname to read while the
              shell is being built — the header would drag every such page out
              of its static shell, or refuse to build at all. The fallback is
              the same empty box the component itself shows before it knows who
              is looking, so nothing moves when it arrives. */}
          <Suspense fallback={<AuthIconPlaceholder />}>
            <HeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
