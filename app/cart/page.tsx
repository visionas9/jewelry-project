import type { Metadata } from "next";
import { CartContents } from "@/components/cart/CartContents";
import { ORDERS_CLOSED, ordersOpenCached } from "@/lib/orders";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Sepetinize eklediğiniz bileklikler.",
};

export default async function CartPage() {
  // The server can't see the cart — it's in the visitor's localStorage. So it
  // sends the catalog (cached, so this costs nothing) and the client matches
  // the ids against it. Prices come from the database every time.
  const [products, open] = await Promise.all([getProducts(), ordersOpenCached()]);

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">Sepet</h1>
      <CartContents
        products={products}
        closedNotice={open ? undefined : ORDERS_CLOSED}
      />
    </section>
  );
}
