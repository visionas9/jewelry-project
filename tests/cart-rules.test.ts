import { describe, expect, it } from "vitest";

import { cartIsFull } from "@/lib/cart-rules";

// The quick-add button on a product card: when does it have nothing left to
// give? Checked here rather than through a browser, because the answer is a
// rule and a rule should not need a rendered page to be sure of.

describe("when the quick-add button is spent", () => {
  it("is not full with room left", () => {
    expect(cartIsFull({ hydrated: true, inCart: 3, stock: 100 })).toBe(false);
  });

  it("is full once the cart holds the whole shelf", () => {
    expect(cartIsFull({ hydrated: true, inCart: 100, stock: 100 })).toBe(true);
  });

  it("is full if somehow it holds more than the shelf", () => {
    // Stock can fall — she corrects a count, or another order lands — while a
    // cart from yesterday still sits in a browser.
    expect(cartIsFull({ hydrated: true, inCart: 5, stock: 2 })).toBe(true);
  });

  it("is full for a product with no stock at all", () => {
    expect(cartIsFull({ hydrated: true, inCart: 0, stock: 0 })).toBe(true);
  });

  it("stays enabled before the cart has been read back", () => {
    // Otherwise every page load starts with a dead button that comes alive a
    // moment later, which reads as broken. The store clamps on the way in, so
    // an early tap cannot overfill.
    expect(cartIsFull({ hydrated: false, inCart: 100, stock: 100 })).toBe(false);
  });
});
