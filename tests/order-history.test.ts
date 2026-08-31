import { beforeAll, describe, expect, it } from "vitest";

import { listOrders } from "@/lib/orders";
import { createMember, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// Read through a member's own client, so the list is exactly what the account
// page will be able to show.

let ayse: Member;
let mehmet: Member;

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

beforeAll(async () => {
  ayse = await createMember("gecmis-ayse@example.com", "cok-gizli-parola-1");
  mehmet = await createMember("gecmis-mehmet@example.com", "cok-gizli-parola-2");
});

describe("a member's order history", () => {
  it("gives back what a list needs about each order", async () => {
    const bracelet = await createProduct({ price: 250, stock: 10 });

    const { data: code } = await ayse.client.rpc("place_order", {
      items: [{ product_id: bracelet.id, quantity: 2 }],
      ...delivery,
    });

    const orders = await listOrders(ayse.client);
    const placed = orders.find((order) => order.code === code);

    expect(placed).toMatchObject({
      code,
      status: "pending",
      total: 500,
      itemCount: 2,
    });
    expect(placed?.placedAt).toEqual(expect.any(String));
  });

  it("puts the newest order first", async () => {
    const bracelet = await createProduct({ price: 100, stock: 10 });
    const codes: string[] = [];

    for (let i = 0; i < 3; i += 1) {
      const { data: code } = await ayse.client.rpc("place_order", {
        items: [{ product_id: bracelet.id, quantity: 1 }],
        ...delivery,
      });
      codes.push(code as string);
    }

    const listed = (await listOrders(ayse.client)).map((order) => order.code);

    // The three just placed, newest first, whatever else is already there.
    expect(listed.filter((code) => codes.includes(code))).toEqual(
      [...codes].reverse()
    );
  });

  it("never contains another member's order", async () => {
    const bracelet = await createProduct({ price: 100, stock: 10 });

    const { data: code } = await mehmet.client.rpc("place_order", {
      items: [{ product_id: bracelet.id, quantity: 1 }],
      ...delivery,
    });

    const listed = (await listOrders(ayse.client)).map((order) => order.code);

    expect(listed).not.toContain(code);
  });

  it("is empty for a member who has never ordered", async () => {
    const newcomer = await createMember(
      "gecmis-yeni@example.com",
      "cok-gizli-parola-3"
    );

    await expect(listOrders(newcomer.client)).resolves.toEqual([]);
  });
});
