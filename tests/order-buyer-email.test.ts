import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createBuyer, createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// The buyer's account email lives in auth.users, which no browser client may
// read. The single-order page needs it, so there is one function that bridges
// the gap — and only for the administrator, only with a second factor.

let hilal: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-email@example.com", "cok-gizli-parola-5");

  await makeAdmin(hilal);
});

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

// A buyer of its own each time — one member may hold only one unpaid order —
// and the buyer comes back, because the email under test is theirs.
async function placeOrder() {
  const bracelet = await createProduct({ price: 250, stock: 5 });
  const buyer = await createBuyer();

  const { data: code, error } = await buyer.client.rpc("place_order", {
    items: [{ product_id: bracelet.id, quantity: 1 }],
    ...delivery,
  });

  if (error || !code) throw new Error(`Could not place an order: ${error?.message}`);

  return { code: code as string, buyer };
}

describe("the buyer's email, for the administrator", () => {
  it("returns the account email of whoever placed the order", async () => {
    const { code, buyer } = await placeOrder();

    const { data, error } = await hilal.client.rpc("order_buyer_email", {
      order_code: code,
    });

    expect(error).toBeNull();
    expect(data).toBe(buyer.email);
  });

  it("refuses a member — even for their own order", async () => {
    const { code, buyer } = await placeOrder();

    const { error } = await buyer.client.rpc("order_buyer_email", {
      order_code: code,
    });

    expect(error?.message).toContain("forbidden");
  });

  it("refuses an order code that names nothing", async () => {
    const { error } = await hilal.client.rpc("order_buyer_email", {
      order_code: "IS-99999",
    });

    expect(error?.message).toContain("unknown_order");
  });

  it("tells a signed-out visitor nothing", async () => {
    const { error } = await anonymous.rpc("order_buyer_email", {
      order_code: "IS-00001",
    });

    expect(error?.code).toBe("42501");
  });
});
