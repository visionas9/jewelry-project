import type { Currency } from "@/types/product";

// One place for money formatting so the grid, the detail page and the cart
// can't drift apart. tr-TR gives "1.000" — dot for thousands, as Turkish uses.
export function formatPrice(price: number, currency: Currency) {
  return `${price.toLocaleString("tr-TR")} ${currency}`;
}

// "3 Eylül 2026". Server-rendered only, so there is no timezone to disagree
// about between the two renders.
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
