import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";

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

// One row of the account page's order list.
export type OrderSummary = {
  code: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  placedAt: string;
};

// The member's own orders, newest first. Takes the caller's client rather than
// building one: the policy returns rows for whoever the client is signed in as,
// so passing the wrong client would return the wrong person's orders.
export async function listOrders(
  client: SupabaseClient
): Promise<OrderSummary[]> {
  const { data, error } = await client
    .from("orders")
    .select("code, status, total, created_at, order_items (quantity)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Siparişler yüklenemedi: ${error.message}`);
  }

  return data.map((order) => ({
    code: order.code,
    status: order.status as OrderStatus,
    total: Number(order.total),
    // How many bracelets, not how many lines: two of one is two.
    itemCount: (order.order_items ?? []).reduce(
      (count: number, line: { quantity: number }) => count + line.quantity,
      0
    ),
    placedAt: order.created_at,
  }));
}

// The state names as somebody reads them. English in the database, Turkish
// here: a state is a fact about the order, and the sentence describing it
// belongs with the rest of the copy rather than in a migration.
export const ORDER_STATUS_LABELS = {
  pending: "Ödeme bekleniyor",
  paid: "Ödeme alındı",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

// The outstanding order's code, when the refusal was about one. Returned
// separately from the sentence so the page can link to it rather than asking
// somebody to find it themselves.
export function unpaidOrderCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const { message, details } = error as { message?: unknown; details?: unknown };

  if (typeof message !== "string" || !message.includes("unpaid_order_exists")) {
    return null;
  }

  return typeof details === "string" && details !== "" ? details : null;
}

export const GENERIC_ORDER_ERROR =
  "Siparişiniz alınamadı. Lütfen birazdan tekrar deneyin.";

export const ORDERS_CLOSED =
  "Siparişlerimiz çok yakında açılıyor. Şimdilik bileklikleri inceleyebilir ve sepetinize ekleyebilirsiniz.";

// Fresh every time — for the checkout page, where a stale answer would show a
// form the database is about to refuse.
export async function ordersOpen(): Promise<boolean> {
  const { data } = await supabase.rpc("orders_open");
  return data === true;
}

// For the cart, which is cached. Opening the shop is a one-off done by hand,
// so a minute's delay before the cart notices is fine.
export async function ordersOpenCached(): Promise<boolean> {
  "use cache";
  cacheLife("minutes");
  return ordersOpen();
}

// place_order refuses in three ways, each with a stable code rather than a
// sentence — see supabase/migrations/0005_orders.sql. This is the one place
// those codes become Turkish.
export function turkishOrderError(error: unknown): string {
  if (!error || typeof error !== "object") return GENERIC_ORDER_ERROR;

  const { message, details } = error as { message?: unknown; details?: unknown };

  if (typeof message !== "string") return GENERIC_ORDER_ERROR;

  if (message.includes("unpaid_order_exists")) {
    // The outstanding code travels in DETAIL, because "you have an unpaid
    // order" is not something anybody can act on when they cannot remember
    // which one. The checkout page turns it into a link.
    return typeof details === "string" && details !== ""
      ? `${details} numaralı siparişinizin ödemesi bekleniyor. Yeni sipariş verebilmek için önce onu tamamlamanız gerekiyor.`
      : "Ödemesi beklenen bir siparişiniz var. Yeni sipariş verebilmek için önce onu tamamlamanız gerekiyor.";
  }

  if (message.includes("insufficient_stock")) {
    // The name of what ran out travels in DETAIL, because "bir ürün" is not
    // enough to act on when the cart holds four things.
    return typeof details === "string" && details !== ""
      ? `${details} için yeterli stok kalmadı. Sepetinizi güncelleyip tekrar deneyin.`
      : "Sepetinizdeki bir ürün için yeterli stok kalmadı. Sepetinizi güncelleyin.";
  }

  if (message.includes("unknown_product")) {
    return "Sepetinizdeki bir ürün artık satışta değil. Lütfen sepetinizi güncelleyin.";
  }

  if (message.includes("orders_closed")) {
    return ORDERS_CLOSED;
  }

  // Only reachable around the checkout form, which offers nothing else.
  if (message.includes("outside_turkey")) {
    return "Yalnızca Türkiye içine gönderim yapılmaktadır. Lütfen Türkiye'deki bir adres ve telefon numarası girin.";
  }

  if (message.includes("empty_order")) {
    return "Sepetiniz boş görünüyor.";
  }

  return GENERIC_ORDER_ERROR;
}
