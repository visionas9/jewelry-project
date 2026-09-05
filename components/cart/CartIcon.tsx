"use client";

import Link from "next/link";

import { useCartCount, useCartHydrated } from "@/lib/stores/cart";

// Client island inside a server-rendered header. The cart lives in localStorage,
// which the server can't read, so the first HTML always says zero. The count is
// held back until the store has hydrated to avoid a number that visibly changes
// from 0 to 3 after load — and the hydration mismatch that comes with it. The
// icon itself is not held back: it is a link, and a link can be drawn before
// anyone knows what is behind it.
export function CartIcon() {
  const hydrated = useCartHydrated();
  const count = useCartCount();
  const showCount = hydrated && count > 0;

  return (
    <Link
      href="/cart"
      title="Sepet"
      className="relative flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
    >
      <BagIcon />

      {showCount ? (
        <span className="absolute top-0.5 right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-ink px-1 py-0.5 text-[0.6rem] leading-none text-cream tabular-nums">
          {count}
        </span>
      ) : null}

      <span className="sr-only">
        Sepet{showCount ? `, ${count} bileklik` : ""}
      </span>
    </Link>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 8h11l-1 11.5h-9L6.5 8Z" />
      <path d="M9.5 8V6.75a2.5 2.5 0 0 1 5 0V8" />
    </svg>
  );
}
