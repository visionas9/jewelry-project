import { beforeAll, describe, expect, it } from "vitest";

import { createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// One unpaid order at a time.
//
// The shop is havale/EFT only: a member with three pending orders has three
// codes against one bank transfer, holds stock for all three, and gives Hilal
// three rows to reconcile by hand. So place_order refuses a second one until
// the first is settled — paid or cancelled, either ends the block.

let hilal: Member;
let ayse: Member;
let fatma: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-tek@example.com", "cok-gizli-parola-7");
  ayse = await createMember("musteri-tek@example.com", "cok-gizli-parola-8");
  fatma = await createMember("baska-musteri@example.com", "cok-gizli-parola-9");

  await makeAdmin(hilal);
});

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

async function order(who: Member, productId: number, quantity = 1) {
  return who.client.rpc("place_order", {
    items: [{ product_id: productId, quantity }],
    ...delivery,
  });
}

describe("a member with an order still waiting for payment", () => {
  it("cannot place a second one, and is told which one to pay", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });

    const { data: first } = await order(ayse, bracelet.id);
    const { error } = await order(ayse, bracelet.id);

    expect(error?.message).toContain("unpaid_order_exists");
    // The code travels in DETAIL, because "you have an unpaid order" is not
    // enough to act on when they cannot remember which.
    expect(error?.details).toBe(first);
  });

  it("spends no stock on the attempt that was refused", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });

    await order(fatma, bracelet.id, 2);
    await order(fatma, bracelet.id, 3);

    const { data } = await fatma.client
      .from("products")
      .select("stock")
      .eq("id", bracelet.id)
      .maybeSingle();

    // Only the first order's two. Nothing is half-done by a refusal.
    expect(data?.stock).toBe(8);
  });

  it("does not block anybody else", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });
    const other = await createMember("uc-uncu@example.com", "cok-gizli-parola-10");

    await order(other, bracelet.id);

    // ayse already has an unpaid order from the first test; this one is a
    // different person and is unaffected by it.
    const { error } = await order(other, bracelet.id);

    expect(error?.message).toContain("unpaid_order_exists");
  });
});

describe("what ends the block", () => {
  it("paying it", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });
    const buyer = await createMember("odeyen@example.com", "cok-gizli-parola-11");

    const { data: first } = await order(buyer, bracelet.id);
    await hilal.client.rpc("mark_paid", { order_code: first });

    const { data: second, error } = await order(buyer, bracelet.id);

    expect(error).toBeNull();
    expect(second).not.toBe(first);
  });

  it("cancelling it", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });
    const buyer = await createMember("iptal@example.com", "cok-gizli-parola-12");

    const { data: first } = await order(buyer, bracelet.id);
    await hilal.client.rpc("cancel_order", { order_code: first });

    const { error } = await order(buyer, bracelet.id);

    expect(error).toBeNull();
  });

  it("but a shipped or delivered order never blocked anything", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });
    const buyer = await createMember("kargo@example.com", "cok-gizli-parola-13");

    const { data: first } = await order(buyer, bracelet.id);
    await hilal.client.rpc("mark_paid", { order_code: first });
    await hilal.client.rpc("mark_shipped", {
      order_code: first,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });

    const { error } = await order(buyer, bracelet.id);

    expect(error).toBeNull();
  });
});
