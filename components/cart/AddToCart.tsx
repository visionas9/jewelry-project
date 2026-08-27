"use client";

import { useState } from "react";
import { useCartQuantity, useCartStore } from "@/lib/stores/cart";
import type { Product } from "@/types/product";

// Quantity lives in local state until you press add — picking "3" is not the
// same as putting 3 in the cart, and treating it that way makes the button lie.
export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartQuantity(product.id);

  const inStock = product.stock > 0;
  // What you can still add, given what's already in the cart.
  const remaining = Math.max(0, product.stock - inCart);
  const canAdd = inStock && remaining > 0;

  function handleAdd() {
    addItem(product.id, { quantity, max: product.stock });
    setQuantity(1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  if (!inStock) {
    return (
      <p className="mt-8 rounded-full border border-line px-7 py-3 text-center text-sm text-muted">
        Bu model tükendi
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 self-start rounded-full border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Adedi azalt"
            className="flex size-11 items-center justify-center rounded-full text-lg transition-colors hover:text-brass disabled:opacity-30 disabled:hover:text-ink"
          >
            −
          </button>

          <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(remaining || 1, q + 1))}
            disabled={quantity >= remaining}
            aria-label="Adedi artır"
            className="flex size-11 items-center justify-center rounded-full text-lg transition-colors hover:text-brass disabled:opacity-30 disabled:hover:text-ink"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
        >
          {canAdd ? "Sepete ekle" : "Sepette tamamı var"}
        </button>
      </div>

      {/* Confirmation without a popup — the page shouldn't move under you. */}
      <p
        aria-live="polite"
        className={`mt-3 text-sm text-muted transition-opacity ${
          justAdded ? "opacity-100" : "opacity-0"
        }`}
      >
        Sepete eklendi.
      </p>
    </div>
  );
}
