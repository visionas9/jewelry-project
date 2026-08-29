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

describe("reading the catalog without a session", () => {
  it("returns every seeded product", async () => {
    const products = await getProducts();

    expect(products).toHaveLength(6);
    expect(products.map((product) => product.slug)).toContain("rose-quartz");
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

    expect(slugs).toHaveLength(6);
    expect(slugs).toContain("pearl-leaf");
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

describe("row level security on products", () => {
  // No data-layer function to call here: lib/products.ts deliberately exposes
  // no writes. These go through the shipped anon client instead — the same
  // client and the same public key a browser would be holding.

  it("refuses an anonymous insert", async () => {
    const { error } = await supabase.from("products").insert({
      slug: "rls-kacak-urun",
      name: "Policy tarafından reddedilmeli",
      price: 1,
      category: "bileklik",
      stone: "kuvars",
      description: "-",
      material: "-",
      size: "-",
    });

    // 42501 is insufficient_privilege: the row failed the table's RLS check.
    expect(error?.code).toBe("42501");
    await expect(getProductBySlug("rls-kacak-urun")).resolves.toBeNull();
  });

  it("silently drops an anonymous delete instead of erroring", async () => {
    // Worth knowing: with RLS on and no delete policy, Postgres does not raise.
    // The policy decides which rows the statement can even see, and no row
    // qualifies, so the delete succeeds against nothing. Asserting on the error
    // alone would pass with the table wide open — assert on the rows.
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("slug", "rose-quartz");

    expect(error).toBeNull();
    await expect(getProductBySlug("rose-quartz")).resolves.not.toBeNull();
  });

  it("silently drops an anonymous update instead of erroring", async () => {
    const { error } = await supabase
      .from("products")
      .update({ price: 1 })
      .eq("slug", "rose-quartz");

    expect(error).toBeNull();
    const product = await getProductBySlug("rose-quartz");
    expect(Number(product?.price)).toBe(1000);
  });
});
