import { describe, expect, it } from "vitest";

import {
  getFilteredProducts,
  getProductBySlug,
  getProductSlugs,
  getProducts,
} from "@/lib/products";
import { supabase } from "@/lib/supabase";

// These run against a real local Postgres with the repo's migrations and RLS
// policies applied. The Supabase client is deliberately not mocked: the access
// rules live in the database, and a mocked client would pass just as happily
// with the policies missing.
//
// Everything here uses the anon key, so it sees exactly what an unauthenticated
// visitor sees.

const SEEDED_SLUGS = [
  "rose-quartz",
  "pearl-leaf",
  "lapis-blue",
  "rhodonite-rose",
  "green-sun",
  "luna-turmalin",
];

describe("reading the catalog without a session", () => {
  it("returns every seeded product", async () => {
    const products = await getProducts();

    // Named rather than counted, for the same reason as the slugs below: the
    // order tests share this database and stand up products of their own.
    expect(products.map((product) => product.slug)).toEqual(
      expect.arrayContaining(SEEDED_SLUGS)
    );
  });

  it("maps a row onto the Product shape", async () => {
    const product = await getProductBySlug("lapis-blue");

    expect(product).not.toBeNull();
    expect(product?.name).toBe("Lapis Blue Lapis Lazuli Doğal Taş Bileklik");
    expect(product?.stone).toBe("lapis");
    // created_at in Postgres, createdAt in the app.
    expect(product?.createdAt).toEqual(expect.any(String));
  });

  it("returns null for a slug that does not exist", async () => {
    await expect(getProductBySlug("boyle-bir-urun-yok")).resolves.toBeNull();
  });

  it("lists the slugs used to build the product routes", async () => {
    const slugs = await getProductSlugs();

    // Every seeded bracelet, rather than a count of the table. The order tests
    // stand up products of their own with known stock, and they share this
    // database — a count here would fail depending on which file ran first.
    expect(slugs).toEqual(expect.arrayContaining(SEEDED_SLUGS));
  });

  it("filters by stone", async () => {
    const products = await getFilteredProducts({ stone: "turmalin" });

    expect(products.map((product) => product.slug)).toEqual(["luna-turmalin"]);
  });

  it("finds a Turkish name typed without its Turkish letters", async () => {
    // "İnci" typed as "inci". The match only works if tr_normalize() in the
    // migration and normalizeSearch() in lib/products.ts agree, which is the
    // kind of thing that silently drifts — hence the test.
    const products = await getFilteredProducts({ query: "inci" });

    expect(products.map((product) => product.slug)).toEqual(["pearl-leaf"]);
  });
});

describe("write access for an anonymous visitor", () => {
  // No data-layer function to call here: lib/products.ts deliberately exposes
  // no writes. These go through the shipped anon client instead — the same
  // client and the same public key a browser would be holding.
  //
  // Two locks stop these, and the tests assert the outcome rather than which
  // one turned first: anon is never granted the write verbs, and there is no
  // insert/update/delete policy behind that. 42501 is insufficient_privilege.

  it("refuses an insert", async () => {
    const { error } = await supabase.from("products").insert({
      slug: "rls-kacak-urun",
      name: "Reddedilmeli",
      price: 1,
      category: "bileklik",
      stone: "kuvars",
      description: "-",
      material: "-",
      size: "-",
    });

    expect(error?.code).toBe("42501");
    await expect(getProductBySlug("rls-kacak-urun")).resolves.toBeNull();
  });

  it("refuses a delete and leaves the row in place", async () => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("slug", "rose-quartz");

    expect(error?.code).toBe("42501");
    await expect(getProductBySlug("rose-quartz")).resolves.not.toBeNull();
  });

  it("refuses an update and leaves the price alone", async () => {
    const { error } = await supabase
      .from("products")
      .update({ price: 1 })
      .eq("slug", "rose-quartz");

    expect(error?.code).toBe("42501");
    const product = await getProductBySlug("rose-quartz");
    expect(Number(product?.price)).toBe(1000);
  });
});
