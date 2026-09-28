import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { turkishOrderError } from "@/lib/orders";
import { adminClient, createBuyer, type Member } from "./support/accounts";
import { createProduct, stockOf } from "./support/products";

// Until the shop can legally take money, it takes no orders. The switch is one
// row in the database, so place_order refuses however it is called — and this
// file runs after every other one, because closing the shop would fail their
// orders.

let buyer: Member;

beforeAll(async () => {
  buyer = await createBuyer();
});

async function setOpen(open: boolean) {
  const { error } = await adminClient()
    .from("shop_settings")
    .update({ orders_open: open })
    .eq("only_row", true);

  if (error) throw new Error(`Could not flip the switch: ${error.message}`);
}

// Whatever a test does, the next one starts with the shop open, as the seed
// leaves it.
afterEach(() => setOpen(true));

async function order(productId: number) {
  return buyer.client.rpc("place_order", {
    items: [{ product_id: productId, quantity: 1 }],
    full_name: "Ayşe Yılmaz",
    phone: "0532 111 22 33",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Caferağa Mah. Örnek Sok. No 3 D 5",
  });
}

describe("while the shop is closed", () => {
  it("refuses a new order and spends no stock", async () => {
    const bracelet = await createProduct({ price: 400, stock: 2 });
    await setOpen(false);

    const { data, error } = await order(bracelet.id);

    expect(error?.message).toContain("orders_closed");
    expect(data).toBeNull();
    expect(await stockOf(bracelet.id)).toBe(2);
  });

  it("says so to anyone who asks, signed in or not", async () => {
    await setOpen(false);
    const stranger = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    expect((await stranger.rpc("orders_open")).data).toBe(false);
    expect((await buyer.client.rpc("orders_open")).data).toBe(false);
  });

  it("tells the buyer in Turkish", () => {
    expect(turkishOrderError({ message: "orders_closed" })).toContain("yakında");
  });
});

describe("while the shop is open", () => {
  it("takes the order", async () => {
    const bracelet = await createProduct({ price: 400, stock: 2 });

    const { error } = await order(bracelet.id);

    expect(error).toBeNull();
    expect(await stockOf(bracelet.id)).toBe(1);
  });
});

describe("the switch itself", () => {
  it("cannot be flipped or read through the public API", async () => {
    await setOpen(false);

    const { data } = await buyer.client.from("shop_settings").select("*");
    await buyer.client.from("shop_settings").update({ orders_open: true }).eq("only_row", true);

    expect(data ?? []).toEqual([]);
    expect((await buyer.client.rpc("orders_open")).data).toBe(false);
  });
});
