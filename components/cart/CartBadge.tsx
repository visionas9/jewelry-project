"use client";

import { useCartCount, useCartHydrated } from "@/lib/stores/cart";

// Client island inside a server-rendered header. The cart lives in localStorage,
// which the server can't read, so the first HTML always says zero. Rendering
// nothing until the store has hydrated avoids a number that visibly changes
// from 0 to 3 after load — and the hydration mismatch that comes with it.
export function CartBadge() {
  const hydrated = useCartHydrated();
  const count = useCartCount();

  if (!hydrated || count === 0) return null;

  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-1.5 py-0.5 text-[0.65rem] leading-none text-cream tabular-nums">
      {count}
      <span className="sr-only"> bileklik sepette</span>
    </span>
  );
}
