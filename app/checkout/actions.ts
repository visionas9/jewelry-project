"use server";

import { revalidatePath } from "next/cache";

import {
  DELIVERY_FIELDS,
  validateDelivery,
  type DeliveryField,
} from "@/lib/delivery";
import {
  priceCart,
  turkishOrderError,
  type CartLine,
  type CartSummary,
} from "@/lib/orders";
import { buyerOrderEmail, shopOrderEmail } from "@/lib/order-emails";
import { sendEmail, SHOP_EMAIL } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";

// The cart lives in the visitor's browser, so the server cannot see it until
// the browser says what is in it. Everything below therefore takes the ids and
// quantities as input and trusts nothing else about them.

// Ids and quantities, and only those. Anything else the browser sends about a
// product — a name, a price — is ignored on the way in rather than checked.
function readCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((line) => ({
      productId: Number((line as CartLine)?.productId),
      quantity: Math.floor(Number((line as CartLine)?.quantity)),
    }))
    .filter(
      (line) =>
        Number.isInteger(line.productId) &&
        line.productId > 0 &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0
    );
}

// What the checkout page shows: the same prices the order will be written at,
// and anything that would stop it being written at all.
export async function reviewCart(cart: unknown): Promise<CartSummary> {
  return priceCart(readCart(cart));
}

// One type for both endings: what went wrong and what was typed, or the code
// of an order that now exists. The browser has work to do on success — emptying
// the cart — so the action reports back rather than redirecting out from under
// it.
export type CheckoutState =
  | {
      status: "error";
      // Beside the field it belongs to. A single sentence at the top of a long
      // form is a sentence nobody sees.
      fieldErrors: Partial<Record<DeliveryField, string>>;
      // Anything not about one field: stock that ran out, a bracelet pulled
      // from the shop.
      message?: string;
      // Echoed back so a rejected submit does not empty the form. React resets
      // an uncontrolled form after an action, so the values have to come from
      // somewhere.
      values: Record<DeliveryField, string>;
    }
  | { status: "placed"; code: string }
  | null;

export async function placeOrder(
  cart: unknown,
  _previous: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const values = Object.fromEntries(
    DELIVERY_FIELDS.map((field) => [
      field,
      String(formData.get(field) ?? "").trim(),
    ])
  ) as Record<DeliveryField, string>;

  const fieldErrors = validateDelivery(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, values };
  }

  const items = readCart(cart);

  if (items.length === 0) {
    return {
      status: "error",
      fieldErrors: {},
      message: "Sepetiniz boş görünüyor.",
      values,
    };
  }

  const supabase = await createServerSupabase();

  // No user id travels with this. place_order takes the buyer from the verified
  // session, and a signed-out caller cannot execute it at all.
  const { data: code, error } = await supabase.rpc("place_order", {
    items: items.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
    })),
    full_name: values.fullName,
    phone: values.phone,
    city: values.city,
    district: values.district,
    address: values.address,
  });

  if (error || typeof code !== "string") {
    return {
      status: "error",
      fieldErrors: {},
      message: turkishOrderError(error),
      values,
    };
  }

  // Stock has moved, so every page that quotes it is stale.
  revalidatePath("/", "layout");

  await announce(supabase, code, values);

  // No redirect here on purpose: the browser still has to empty the cart, and
  // it must not do that until the order is known to exist.
  return { status: "placed", code };
}

// Tells the shop and the buyer that an order exists.
//
// Everything here is after the fact: the order is written and paid for or not
// regardless. So nothing it does may throw — a mail service having a bad
// afternoon must not turn a placed order into an error on the buyer's screen.
async function announce(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  code: string,
  values: Record<DeliveryField, string>
) {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("total, order_items (quantity, unit_price, products (name))")
      .eq("code", code)
      .maybeSingle();

    if (!order) return;

    const lines = (order.order_items ?? []).map((line) => {
      const product = Array.isArray(line.products) ? line.products[0] : line.products;

      return {
        name: (product as { name?: string } | null)?.name ?? "Ürün",
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
      };
    });

    const details = {
      code,
      total: Number(order.total),
      fullName: values.fullName,
      phone: values.phone,
      city: values.city,
      district: values.district,
      address: values.address,
      lines,
    };

    const { data: user } = await supabase.auth.getUser();

    await Promise.all([
      sendEmail({ to: SHOP_EMAIL, ...shopOrderEmail(details) }),
      user.user?.email
        ? sendEmail({ to: user.user.email, ...buyerOrderEmail(details) })
        : Promise.resolve("skipped" as const),
    ]);
  } catch (error) {
    console.error(`[email] could not announce ${code}`, error);
  }
}
