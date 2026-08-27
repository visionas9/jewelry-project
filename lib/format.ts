import type { Currency } from "@/types/product";

// One place for money formatting so the grid, the detail page and the cart
// can't drift apart. tr-TR gives "1.000" — dot for thousands, as Turkish uses.
export function formatPrice(price: number, currency: Currency) {
  return `${price.toLocaleString("tr-TR")} ${currency}`;
}
