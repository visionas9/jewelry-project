import { beforeAll, describe, expect, it } from "vitest";

import { supabase as anonymous } from "@/lib/supabase";
import { createMember, makeAdmin, type Member } from "./support/accounts";
import { createProduct, stockOf } from "./support/products";

// Moving an order along: paid, shipped, delivered, cancelled.
//
// This is where stock and money meet, so every assertion goes through a client
// carrying the public anon key — the administrator's calls are subject to the
// same policies a real browser would face, and the member's are meant to fail.

let hilal: Member;
let ayse: Member;

beforeAll(async () => {
  hilal = await createMember("yonetici-siparis@example.com", "cok-gizli-parola-3");
  ayse = await createMember("musteri-siparis@example.com", "cok-gizli-parola-4");

  await makeAdmin(hilal);
});

const delivery = {
  full_name: "Ayşe Yılmaz",
  phone: "05001112233",
  city: "İstanbul",
  district: "Kadıköy",
  address: "Caferağa Mah. Örnek Sok. No 3 D 5",
};

/** A real order, placed the only way orders can be placed. */
async function placeOrder(quantity = 1, stock = 5) {
  const bracelet = await createProduct({ price: 250, stock });

  const { data: code, error } = await ayse.client.rpc("place_order", {
    items: [{ product_id: bracelet.id, quantity }],
    ...delivery,
  });

  if (error || !code) throw new Error(`Could not place an order: ${error?.message}`);

  return { code: code as string, product: bracelet };
}

async function read(code: string) {
  const { data, error } = await hilal.client
    .from("orders")
    .select("status, paid_at, shipped_at, delivered_at, cancelled_at, carrier, tracking_number")
    .eq("code", code)
    .single();

  if (error || !data) throw new Error(`Could not read ${code}: ${error?.message}`);

  return data;
}

describe("moving an order along", () => {
  it("marks it paid and stamps when", async () => {
    const { code } = await placeOrder();

    const { error } = await hilal.client.rpc("mark_paid", { order_code: code });

    expect(error).toBeNull();

    const order = await read(code);
    expect(order.status).toBe("paid");
    expect(order.paid_at).not.toBeNull();
  });

  it("records the carrier and the tracking number when it ships", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    const { error } = await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });

    expect(error).toBeNull();

    const order = await read(code);
    expect(order.status).toBe("shipped");
    expect(order.carrier).toBe("Yurtiçi Kargo");
    expect(order.tracking_number).toBe("1234567890");
    expect(order.shipped_at).not.toBeNull();
  });

  it("marks it delivered once it has shipped", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });
    const { error } = await hilal.client.rpc("mark_delivered", { order_code: code });

    expect(error).toBeNull();

    const order = await read(code);
    expect(order.status).toBe("delivered");
    expect(order.delivered_at).not.toBeNull();
  });

  it("leaves an order that is already there alone", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    const first = await read(code);

    // She clicks the button twice. The second click is not an error, and it
    // does not move the timestamp the first one wrote.
    const { error } = await hilal.client.rpc("mark_paid", { order_code: code });

    expect(error).toBeNull();
    expect((await read(code)).paid_at).toBe(first.paid_at);
  });
});

describe("cancelling", () => {
  it("puts the stock back", async () => {
    const { code, product } = await placeOrder(2, 5);

    expect(await stockOf(product.id)).toBe(3);

    const { error } = await hilal.client.rpc("cancel_order", { order_code: code });

    expect(error).toBeNull();
    expect(await stockOf(product.id)).toBe(5);

    const order = await read(code);
    expect(order.status).toBe("cancelled");
    expect(order.cancelled_at).not.toBeNull();
  });

  it("puts it back exactly once", async () => {
    const { code, product } = await placeOrder(2, 5);

    await hilal.client.rpc("cancel_order", { order_code: code });
    const { error } = await hilal.client.rpc("cancel_order", { order_code: code });

    expect(error).toBeNull();
    expect(await stockOf(product.id)).toBe(5);
  });

  it("cancels an order that was already paid for", async () => {
    const { code, product } = await placeOrder(1, 5);

    await hilal.client.rpc("mark_paid", { order_code: code });
    const { error } = await hilal.client.rpc("cancel_order", { order_code: code });

    expect(error).toBeNull();
    expect(await stockOf(product.id)).toBe(5);
  });
});

describe("transitions that make no sense", () => {
  it("refuses to ship an order nobody has paid for", async () => {
    const { code } = await placeOrder();

    const { error } = await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });

    expect(error?.message).toContain("invalid_transition");
    expect((await read(code)).status).toBe("pending");
  });

  it("refuses to deliver an order that has not shipped", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    const { error } = await hilal.client.rpc("mark_delivered", { order_code: code });

    expect(error?.message).toContain("invalid_transition");
    expect((await read(code)).status).toBe("paid");
  });

  it("refuses to take a delivered order back to paid", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });
    await hilal.client.rpc("mark_delivered", { order_code: code });

    const { error } = await hilal.client.rpc("mark_paid", { order_code: code });

    expect(error?.message).toContain("invalid_transition");
    expect((await read(code)).status).toBe("delivered");
  });

  it("refuses to cancel a delivered order, and returns no stock", async () => {
    const { code, product } = await placeOrder(2, 5);

    await hilal.client.rpc("mark_paid", { order_code: code });
    await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });
    await hilal.client.rpc("mark_delivered", { order_code: code });

    const { error } = await hilal.client.rpc("cancel_order", { order_code: code });

    expect(error?.message).toContain("invalid_transition");
    expect((await read(code)).status).toBe("delivered");
    expect(await stockOf(product.id)).toBe(3);
  });

  it("refuses to ship without a carrier or a tracking number", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    const { error } = await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "  ",
      tracking_number: "1234567890",
    });

    expect(error?.message).toContain("missing_tracking");
    expect((await read(code)).status).toBe("paid");
  });

  it("refuses an order code that names nothing", async () => {
    const { error } = await hilal.client.rpc("mark_paid", { order_code: "IS-99999" });

    expect(error?.message).toContain("unknown_order");
  });
});

describe("who may move an order along", () => {
  it("refuses the member who placed it", async () => {
    const { code } = await placeOrder();

    const { error } = await ayse.client.rpc("mark_paid", { order_code: code });

    expect(error?.message).toContain("forbidden");
    expect((await read(code)).status).toBe("pending");
  });

  it("refuses a member cancelling their own order to get the stock back", async () => {
    const { code, product } = await placeOrder(2, 5);

    const { error } = await ayse.client.rpc("cancel_order", { order_code: code });

    expect(error?.message).toContain("forbidden");
    expect(await stockOf(product.id)).toBe(3);
  });

  it("refuses a member marking a shipped order delivered", async () => {
    const { code } = await placeOrder();

    await hilal.client.rpc("mark_paid", { order_code: code });
    await hilal.client.rpc("mark_shipped", {
      order_code: code,
      carrier: "Yurtiçi Kargo",
      tracking_number: "1234567890",
    });

    const { error } = await ayse.client.rpc("mark_delivered", { order_code: code });

    expect(error?.message).toContain("forbidden");
    expect((await read(code)).status).toBe("shipped");
  });

  it("tells a signed-out visitor nothing", async () => {
    const { error } = await anonymous.rpc("mark_paid", { order_code: "IS-00001" });

    expect(error?.code).toBe("42501");
  });
});
