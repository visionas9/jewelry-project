// The couriers she can hand a parcel to.
//
// A fixed list rather than a text field: the carrier name is typed once and
// then read back by whoever is chasing a parcel, so "Yurtici" and "yurtiçi
// kargo" and "Yurtiçi Kargo" being the same firm is a problem worth not having.
// Choosing from a list also means the stored value can be trusted later — a
// tracking link built from it has exactly one spelling to handle.
//
// Adding one is a one-line change here; nothing else needs touching.
export const CARRIERS = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "Sendeo",
  "Kolay Gelsin",
  "HepsiJET",
  "Trendyol Express",
  "UPS",
  "DHL",
  "FedEx",
] as const;

export type Carrier = (typeof CARRIERS)[number];

// Exact match only — not trimmed, not case-folded, not fuzzy. A <select> is a
// suggestion to a browser, never a constraint on the request behind it, so the
// server checks the value it was actually sent. Guessing at a near miss would
// put a spelling in the database that nothing else expects.
export function isKnownCarrier(value: string): value is Carrier {
  return (CARRIERS as readonly string[]).includes(value);
}
