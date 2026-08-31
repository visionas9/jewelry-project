import { beforeAll, describe, expect, it } from "vitest";

import { createMember, type Member } from "./support/accounts";

// Every assertion goes through a client holding the public anon key — the same
// key a browser has — so nothing here is proved by privilege the application
// would not have. The admin client appears only to set up products, never to
// check one.

let ayse: Member;

beforeAll(async () => {
  ayse = await createMember("siparis-ayse@example.com", "cok-gizli-parola-1");
});

describe("placing an order", () => {
  it("hands back a code for the order it created", async () => {
    const { data: code, error } = await ayse.client.rpc("place_order", {
      items: [{ product_id: 1, quantity: 2 }],
      full_name: "Ayşe Yılmaz",
      phone: "05001112233",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mah. Örnek Sok. No 3 D 5",
    });

    expect(error).toBeNull();
    // Readable over the phone, because it is what goes in the transfer
    // description and what she matches against the bank statement.
    expect(code).toMatch(/^IS-\d{5}$/);
  });

  it("prices the order from the database, not from the caller", async () => {
    // The seeded bracelets are 1000 TRY. Two of them is 2000, whatever the
    // browser believes — the cart only ever sends ids and quantities.
    const { data: code } = await ayse.client.rpc("place_order", {
      items: [{ product_id: 1, quantity: 2 }],
      full_name: "Ayşe Yılmaz",
      phone: "05001112233",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Caferağa Mah. Örnek Sok. No 3 D 5",
    });

    const { data: order, error } = await ayse.client
      .from("orders")
      .select("code, total, full_name, city")
      .eq("code", code)
      .maybeSingle();

    expect(error).toBeNull();
    expect(Number(order?.total)).toBe(2000);
    expect(order?.full_name).toBe("Ayşe Yılmaz");
    expect(order?.city).toBe("İstanbul");
  });
});
