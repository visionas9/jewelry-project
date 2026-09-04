"use client";

import { useEffect, useRef, useState } from "react";

import { cartIsFull } from "@/lib/cart-rules";
import { useCartHydrated, useCartQuantity, useCartStore } from "@/lib/stores/cart";

// One tap, one bracelet, from the grid.
//
// Always visible rather than revealed on hover: the shop is used on phones, and
// a control that only appears on hover is a control that does not exist there.
//
// Deliberately adds exactly one. Choosing a quantity is what the product page
// is for — a stepper on a card is a second, worse version of it.

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden="true"
    >
      <path d="M6 8h12l-1 11H7L6 8Z" />
      <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px]"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function QuickAdd({
  productId,
  name,
  stock,
}: {
  productId: number;
  name: string;
  stock: number;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartQuantity(productId);
  const hydrated = useCartHydrated();
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (stock === 0) {
    return (
      <span className="absolute right-3 bottom-3 rounded-full border border-line bg-cream/90 px-3 py-1.5 text-xs text-muted backdrop-blur-sm">
        Tükendi
      </span>
    );
  }

  const full = cartIsFull({ hydrated, inCart, stock });

  return (
    <button
      type="button"
      disabled={full}
      onClick={() => {
        addItem(productId, { quantity: 1, max: stock });
        setJustAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setJustAdded(false), 1600);
      }}
      // The name is in the label because a grid of these is otherwise a row of
      // identical "add" buttons to anyone using a screen reader.
      aria-label={
        full ? `${name} — stoktakilerin hepsi sepetinizde` : `${name} — sepete ekle`
      }
      className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full border border-line/70 bg-cream/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:border-clay hover:bg-clay hover:text-cream disabled:border-line disabled:bg-cream/70 disabled:text-muted disabled:hover:bg-cream/70 disabled:hover:text-muted"
    >
      {justAdded ? <CheckIcon /> : <BagIcon />}
      {/* Announced without moving anything on screen. */}
      <span aria-live="polite" className="sr-only">
        {justAdded ? "Sepete eklendi" : ""}
      </span>
    </button>
  );
}
