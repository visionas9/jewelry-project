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

// "3 Eylül 2026, 14:05". For the admin order timeline, where the time of day is
// the point — she wants to know when the money landed, not just the date.
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
