import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct, stockOf } from "./support/products";

// The catalog was read-only to the API until now — the shop edited it with the
// service role key. The panel needs her to do it herself, so the write verbs
// are granted and is_admin() decides, exactly as it does for orders and posts.

let hilal: Member;
let ayse: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-katalog@example.com", "cok-gizli-parola-30");
  ayse = await createMember("musteri-katalog@example.com", "cok-gizli-parola-31");

  await makeAdmin(hilal);
});

const draft = {
  slug: "yeni-bileklik",
  name: "Yeni Bileklik",
  price: 750,
  category: "bileklik",
  stone: "kuvars",
  description: "Elde dizilmiş.",
  material: "Doğal taş",
  size: "18 cm",
  stock: 4,
  images: [],
};

describe("who may change the catalog", () => {
  it("lets the administrator add a product", async () => {
    const { data, error } = await hilal.client
      .from("products")
      .insert({ ...draft, slug: "yonetici-ekledi" })
      .select("name, stock")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.stock).toBe(4);
  });

  it("lets the administrator correct a price and a stock count", async () => {
    const bracelet = await createProduct({ price: 250, stock: 2 });

    const { error } = await hilal.client
      .from("products")
      .update({ price: 300, stock: 9 })
      .eq("id", bracelet.id);

    expect(error).toBeNull();
    expect(await stockOf(bracelet.id)).toBe(9);
  });

  it("lets the administrator remove one", async () => {
    await hilal.client.from("products").insert({ ...draft, slug: "silinecek" });

    const { error } = await hilal.client
      .from("products")
      .delete()
      .eq("slug", "silinecek");

    expect(error).toBeNull();
  });

  it("refuses an ordinary member", async () => {
    const { error } = await ayse.client
      .from("products")
      .insert({ ...draft, slug: "uye-ekledi" });

    expect(error).not.toBeNull();
  });

  it("refuses a member repricing a bracelet they want cheaper", async () => {
    const bracelet = await createProduct({ price: 250, stock: 2 });

    await ayse.client.from("products").update({ price: 1 }).eq("id", bracelet.id);

    const { data } = await anonymous
      .from("products")
      .select("price")
      .eq("id", bracelet.id)
      .maybeSingle();

    // The price a browser sees is the price the shop set, whatever was sent.
    expect(Number(data?.price)).toBe(250);
  });

  it("refuses a member with no error at all, which is the trap", async () => {
    const bracelet = await createProduct({ price: 250, stock: 2 });

    const { data, error } = await ayse.client
      .from("products")
      .update({ stock: 999 })
      .eq("id", bracelet.id)
      .select("slug")
      .maybeSingle();

    // This is why lib/admin-write.ts exists. A blocked update is not an error:
    // the statement ran, matched no rows, and succeeded. Checking `error` alone
    // reports it as saved.
    expect(error).toBeNull();
    expect(data).toBeNull();
    expect(await stockOf(bracelet.id)).toBe(2);
  });

  it("refuses a signed-out visitor", async () => {
    const { error } = await anonymous
      .from("products")
      .insert({ ...draft, slug: "ziyaretci-ekledi" });

    expect(error).not.toBeNull();
  });

  it("still lets anybody read the catalog", async () => {
    const bracelet = await createProduct({ price: 250, stock: 2 });

    const { data, error } = await anonymous
      .from("products")
      .select("id")
      .eq("id", bracelet.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(bracelet.id);
  });
});
