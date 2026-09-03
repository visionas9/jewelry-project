import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// The buyer's account email lives in auth.users, which no browser client may
// read. The single-order page needs it, so there is one function that bridges
// the gap — and only for the administrator, only with a second factor.

let hilal: Member;
let ayse: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-email@example.com", "cok-gizli-parola-5");
  ayse = await createMember("musteri-email@example.com", "cok-gizli-parola-6");

  await makeAdmin(hilal);
});

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

async function placeOrder() {
  const bracelet = await createProduct({ price: 250, stock: 5 });

  const { data: code, error } = await ayse.client.rpc("place_order", {
    items: [{ product_id: bracelet.id, quantity: 1 }],
    ...delivery,
  });

  if (error || !code) throw new Error(`Could not place an order: ${error?.message}`);

  return code as string;
}

describe("the buyer's email, for the administrator", () => {
  it("returns the account email of whoever placed the order", async () => {
    const code = await placeOrder();

    const { data, error } = await hilal.client.rpc("order_buyer_email", {
      order_code: code,
    });

    expect(error).toBeNull();
    expect(data).toBe("musteri-email@example.com");
  });

  it("refuses a member — even for their own order", async () => {
    const code = await placeOrder();

    const { error } = await ayse.client.rpc("order_buyer_email", {
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
