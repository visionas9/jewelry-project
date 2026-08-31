import { adminClient } from "./accounts";

// Setup only, like createMember. The seeded bracelets all carry a stock of 100,
// which is no use to a test about running out — these are made to order with
// the exact stock the test needs.
let counter = 0;

export async function createProduct(fields: {
  price: number;
  stock: number;
}): Promise<{ id: number; price: number }> {
  const slug = `test-bileklik-${++counter}-${Date.now()}`;

  const { data, error } = await adminClient()
    .from("products")
    .insert({
      slug,
      name: `Test Bileklik ${counter}`,
      price: fields.price,
      category: "bileklik",
      stone: "kuvars",
      description: "Test için oluşturuldu.",
      material: "Doğal taş",
      size: "17–18 cm",
      stock: fields.stock,
    })
    .select("id, price")
    .single();

  if (error || !data) {
    throw new Error(`Could not create a test product: ${error?.message}`);
  }

  return { id: data.id as number, price: Number(data.price) };
}

// Read back through the public catalog, which anyone may read — so a test can
// watch stock move without the service role doing the looking.
export async function stockOf(productId: number): Promise<number> {
  const { data, error } = await adminClient()
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (error || !data) throw new Error(`No product ${productId}`);

  return data.stock as number;
}
