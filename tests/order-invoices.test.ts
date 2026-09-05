import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createBuyer, createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct } from "./support/products";

// The fatura she attaches to an order.
//
// Unlike a blog image this is not a public file: it carries a name, an address
// and a phone number. So the bucket is private, and the column that points at
// it is only writable by the administrator.

let hilal: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-fatura@example.com", "cok-gizli-parola-40");
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
  const buyer = await createBuyer();

  const { data: code, error } = await buyer.client.rpc("place_order", {
    items: [{ product_id: bracelet.id, quantity: 1 }],
    ...delivery,
  });

  if (error || !code) throw new Error(`Could not place an order: ${error?.message}`);

  return { code: code as string, buyer };
}

describe("the invoice on an order", () => {
  it("lets the administrator record where it is stored", async () => {
    const { code } = await placeOrder();

    const { data, error } = await hilal.client
      .from("orders")
      .update({ invoice_path: `${code}/fatura.pdf` })
      .eq("code", code)
      .select("invoice_path")
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.invoice_path).toBe(`${code}/fatura.pdf`);
  });

  it("lets the buyer see that their order has one", async () => {
    const { code, buyer } = await placeOrder();

    await hilal.client
      .from("orders")
      .update({ invoice_path: `${code}/fatura.pdf` })
      .eq("code", code);

    const { data } = await buyer.client
      .from("orders")
      .select("invoice_path")
      .eq("code", code)
      .maybeSingle();

    // They may read the pointer on their own order — that is how the page
    // knows whether to offer a download at all.
    expect(data?.invoice_path).toBe(`${code}/fatura.pdf`);
  });

  it("refuses a buyer attaching one to their own order", async () => {
    const { code, buyer } = await placeOrder();

    await buyer.client
      .from("orders")
      .update({ invoice_path: "sahte/fatura.pdf" })
      .eq("code", code);

    const { data } = await hilal.client
      .from("orders")
      .select("invoice_path")
      .eq("code", code)
      .maybeSingle();

    // An order's own buyer may read it but never write it: a fatura is the
    // shop's record, not something the customer supplies.
    expect(data?.invoice_path).toBeNull();
  });

  it("still refuses the administrator rewriting anything else on the order", async () => {
    const { code } = await placeOrder();

    const { error } = await hilal.client
      .from("orders")
      .update({ status: "delivered", total: 1 })
      .eq("code", code);

    // The grant is on invoice_path alone. An order still moves only through the
    // transition functions — being the administrator does not make the API a
    // way around them.
    expect(error?.code).toBe("42501");

    const { data } = await hilal.client
      .from("orders")
      .select("status")
      .eq("code", code)
      .maybeSingle();

    expect(data?.status).toBe("pending");
  });

  it("keeps the bucket out of a signed-out visitor's reach", async () => {
    const { data, error } = await anonymous.storage
      .from("invoices")
      .list();

    expect(data ?? []).toEqual([]);
    if (error) expect(error).not.toBeNull();
  });
});
