import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createBuyer, createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// The shop has one administrator. These check what she can see that a member
// cannot, and that nobody can quietly join her — every assertion goes through a
// client holding the public anon key.

let hilal: Member;
let ayse: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici@example.com", "cok-gizli-parola-1");
  ayse = await createMember("musteri@example.com", "cok-gizli-parola-2");

  // Granting admin is a setup step, exactly as it will be in production: one
  // row written with a key that never reaches a browser, and a second factor
  // verified — without which is_admin() is false however right the account is.
  await makeAdmin(hilal);
});

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

describe("who the database thinks is an administrator", () => {
  it("says so for the administrator", async () => {
    const { data, error } = await hilal.client.rpc("is_admin");

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("says no for an ordinary member", async () => {
    const { data } = await ayse.client.rpc("is_admin");

    expect(data).toBe(false);
  });
});

describe("what the administrator can see", () => {
  it("reads an order placed by somebody else", async () => {
    const bracelet = await createProduct({ price: 250, stock: 5 });
    const buyer = await createBuyer();

    const { data: code } = await buyer.client.rpc("place_order", {
      items: [{ product_id: bracelet.id, quantity: 1 }],
      ...delivery,
    });

    const { data, error } = await hilal.client
      .from("orders")
      .select("code, total, full_name")
      .eq("code", code)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.code).toBe(code);
    expect(data?.full_name).toBe("Ayşe Yılmaz");
  });

  it("reads the lines of somebody else's order", async () => {
    const bracelet = await createProduct({ price: 250, stock: 5 });
    const buyer = await createBuyer();

    const { data: code } = await buyer.client.rpc("place_order", {
      items: [{ product_id: bracelet.id, quantity: 2 }],
      ...delivery,
    });

    const { data: order } = await hilal.client
      .from("orders")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    const { data: lines } = await hilal.client
      .from("order_items")
      .select("quantity")
      .eq("order_id", order!.id);

    expect(lines).toHaveLength(1);
    expect(lines?.[0].quantity).toBe(2);
  });
});

describe("what nobody can do", () => {
  it("hides the administrator list from the administrator herself", async () => {
    const { data, error } = await hilal.client.from("admins").select("id");

    // Knowing the answer to "am I an admin" is not the same as being able to
    // read who is. There is nothing to enumerate here, for anyone.
    expect(data ?? []).toEqual([]);
    if (error) expect(error.code).toBe("42501");
  });

  it("refuses a member trying to make themselves one", async () => {
    const { error } = await ayse.client.from("admins").insert({ id: ayse.id });

    expect(error).not.toBeNull();
  });

  it("still shows a member only their own orders", async () => {
    const bracelet = await createProduct({ price: 250, stock: 5 });

    const { data: code } = await hilal.client.rpc("place_order", {
      items: [{ product_id: bracelet.id, quantity: 1 }],
      ...delivery,
    });

    const { data } = await ayse.client.from("orders").select("code").eq("code", code);

    expect(data).toEqual([]);
  });

  it("tells a signed-out visitor nothing", async () => {
    const { error } = await anonymous.rpc("is_admin");

    expect(error?.code).toBe("42501");
  });
});
