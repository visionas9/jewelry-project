import { beforeAll, describe, expect, it } from "vitest";

import { turkishOrderError } from "@/lib/orders";
import { PROVINCES } from "@/lib/provinces";
import { adminClient, createMember, type Member } from "./support/accounts";
import { createProduct, stockOf } from "./support/products";

// The checkout form only offers Turkish provinces, but place_order is a public
// endpoint: anyone signed in can call it straight from the browser console with
// whatever address they like. So the database refuses it too.

let ayse: Member;
let mehmet: Member;
let can: Member;

beforeAll(async () => {
  ayse = await createMember("yurtdisi-il@example.com", "cok-gizli-parola-50");
  mehmet = await createMember("yurtdisi-tel@example.com", "cok-gizli-parola-51");
  can = await createMember("yurtici@example.com", "cok-gizli-parola-52");
});

const turkish = {
  full_name: "Ayşe Yılmaz",
  phone: "0532 111 22 33",
  city: "İzmir",
  district: "Karşıyaka",
  address: "Örnek Mah. Deniz Sok. No 7",
};

async function order(who: Member, productId: number, delivery: Partial<typeof turkish>) {
  return who.client.rpc("place_order", {
    items: [{ product_id: productId, quantity: 1 }],
    ...turkish,
    ...delivery,
  });
}

describe("an order placed around the checkout form", () => {
  it("is refused for a city outside Turkey, and spends no stock", async () => {
    const bracelet = await createProduct({ price: 300, stock: 3 });

    const { data, error } = await order(ayse, bracelet.id, { city: "Warszawa" });

    expect(error?.message).toContain("outside_turkey");
    expect(data).toBeNull();
    expect(await stockOf(bracelet.id)).toBe(3);
  });

  it("is refused for a phone number from another country", async () => {
    const bracelet = await createProduct({ price: 300, stock: 3 });

    const { error } = await order(mehmet, bracelet.id, { phone: "+48 512 345 678" });

    expect(error?.message).toContain("outside_turkey");
    expect(await stockOf(bracelet.id)).toBe(3);
  });

  it("goes through for a Turkish address, however the phone is written", async () => {
    const bracelet = await createProduct({ price: 300, stock: 3 });

    const { data, error } = await order(can, bracelet.id, { phone: "+90 (532) 111-22-33" });

    expect(error).toBeNull();
    expect(data).toMatch(/^IS-\d{5}$/);
  });

  it("tells the buyer in Turkish", () => {
    expect(turkishOrderError({ message: "outside_turkey" })).toContain("Türkiye");
  });
});

describe("the province list", () => {
  it("is the same in the database as in the checkout form", async () => {
    const { data } = await adminClient().from("provinces").select("name");

    // If these drift, the form offers a province the database refuses.
    expect(data?.map((row) => row.name).sort()).toEqual([...PROVINCES].sort());
  });

  it("cannot be read or changed through the public API", async () => {
    const { data } = await can.client.from("provinces").select("name");
    const { error } = await can.client.from("provinces").insert({ name: "Warszawa" });

    expect(data ?? []).toEqual([]);
    expect(error).not.toBeNull();
  });
});
