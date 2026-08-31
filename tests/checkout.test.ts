import { describe, expect, it } from "vitest";

import { priceCart } from "@/lib/orders";
import { createProduct } from "./support/products";

// The catalog is public, so this reads through the same session-free client the
// product pages use. What is under test is the arithmetic and the warnings,
// both of which decide what somebody is told before they commit to buying.

describe("pricing a cart", () => {
  it("prices every line from the catalog and adds them up", async () => {
    const first = await createProduct({ price: 120.5, stock: 10 });
    const second = await createProduct({ price: 300, stock: 10 });

    const summary = await priceCart([
      { productId: first.id, quantity: 2 },
      { productId: second.id, quantity: 1 },
    ]);

    // 2 × 120.50 + 300 = 541.00
    expect(summary.total).toBe(541);
    expect(summary.lines).toHaveLength(2);
    expect(summary.problems).toEqual([]);
  });

  it("reports a bracelet that is no longer in the shop", async () => {
    const summary = await priceCart([{ productId: 987654321, quantity: 1 }]);

    expect(summary.problems).toEqual([
      { kind: "missing", productId: 987654321 },
    ]);
    expect(summary.lines).toEqual([]);
    expect(summary.total).toBe(0);
  });

  it("reports a line asking for more than is left, and says how many", async () => {
    const bracelet = await createProduct({ price: 200, stock: 2 });

    const summary = await priceCart([{ productId: bracelet.id, quantity: 5 }]);

    expect(summary.problems).toEqual([
      {
        kind: "short",
        productId: bracelet.id,
        name: expect.any(String),
        available: 2,
      },
    ]);
  });

  it("has nothing to say about an empty cart", async () => {
    // Reachable by clearing the cart in another tab and coming back, so it has
    // to be a quiet answer rather than a failed query.
    const summary = await priceCart([]);

    expect(summary).toEqual({ lines: [], total: 0, problems: [] });
  });
});
