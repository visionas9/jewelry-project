import "server-only";

import { supabase } from "./supabase";

// What the cart is worth, decided by the catalog rather than by the browser.
//
// The cart in localStorage holds only ids and quantities, on purpose: a price
// kept there would be a price from whenever the visitor last looked. This is
// where those ids become money, and it is the same answer the checkout page
// shows and the order action later charges — one calculation, not two that can
// drift apart.

export type CartLine = { productId: number; quantity: number };

export type PricedLine = {
  productId: number;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

// Anything that stops a line being bought as asked. Reported rather than
// silently dropped: a cart that quietly shrinks between one screen and the next
// is how somebody ends up paying for less than they thought.
export type CartProblem =
  | { kind: "missing"; productId: number }
  | { kind: "short"; productId: number; name: string; available: number };

export type CartSummary = {
  lines: PricedLine[];
  total: number;
  problems: CartProblem[];
};

export async function priceCart(cart: CartLine[]): Promise<CartSummary> {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, price, stock, images")
    .in("id", cart.map((line) => line.productId));

  if (error) {
    throw new Error(`Sepet fiyatlandırılamadı: ${error.message}`);
  }

  const lines: PricedLine[] = [];
  const problems: CartProblem[] = [];

  for (const line of cart) {
    const product = data.find((row) => row.id === line.productId);

    // Pulled from the shop since it was added to the cart. There is no price to
    // show and nothing to ship, so it becomes a problem rather than a line.
    if (!product) {
      problems.push({ kind: "missing", productId: line.productId });
      continue;
    }

    // Priced and shown anyway, with what is left named: somebody asking for
    // five of the last two wants to buy two, not to be sent back to the shop.
    if (product.stock < line.quantity) {
      problems.push({
        kind: "short",
        productId: product.id,
        name: product.name,
        available: product.stock,
      });
    }

    const unitPrice = Number(product.price);

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? null,
      unitPrice,
      quantity: line.quantity,
      subtotal: unitPrice * line.quantity,
    });
  }

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.subtotal, 0),
    problems,
  };
}
