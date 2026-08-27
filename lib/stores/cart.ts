import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Only the id and how many. Never a copy of the product itself — a cart can sit
// in localStorage for weeks, and a snapshot would keep quoting a price that
// changed in the database months ago. Product data is always looked up fresh.
export type CartItem = {
  productId: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];

  addItem: (productId: number, options?: { quantity?: number; max?: number }) => void;
  setQuantity: (productId: number, quantity: number, max?: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "atolye-tas-cart";

// Quantities are clamped here rather than in the UI. A store that can hold an
// impossible value is a store every component has to defend against.
function clamp(quantity: number, max?: number) {
  const atLeastOne = Math.max(1, Math.floor(quantity));
  return max === undefined ? atLeastOne : Math.min(atLeastOne, Math.max(1, max));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (productId, options) =>
        set((state) => {
          const quantity = options?.quantity ?? 1;
          const existing = state.items.find((i) => i.productId === productId);

          // Adding something already in the cart adds to it — it doesn't reset
          // it. Two visits to a product page means two of them.
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? {
                      ...item,
                      quantity: clamp(item.quantity + quantity, options?.max),
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId, quantity: clamp(quantity, options?.max) },
            ],
          };
        }),

      setQuantity: (productId, quantity, max) =>
        set((state) => {
          // Stepping below one removes the line rather than leaving a zero.
          if (quantity < 1) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: clamp(quantity, max) }
                : item
            ),
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// localStorage is client-only, so the server always renders an empty cart. This
// returns false on the server and during the hydration render, then true — which
// is exactly what React needs to avoid a mismatch.
//
// useSyncExternalStore rather than a useEffect flag: the server snapshot is a
// first-class argument here instead of something patched in after mount.
// `subscribe` is a no-op because the answer only ever changes once.
const noopSubscribe = () => () => {};

export function useCartHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

// Primitive selectors on purpose: returning a new object or array from a
// selector gives a new reference every render, which re-renders forever.
export function useCartCount() {
  return useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );
}

export function useCartQuantity(productId: number) {
  return useCartStore(
    (state) =>
      state.items.find((item) => item.productId === productId)?.quantity ?? 0
  );
}
