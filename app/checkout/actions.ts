"use server";

import { revalidatePath } from "next/cache";

import {
  priceCart,
  turkishOrderError,
  type CartLine,
  type CartSummary,
} from "@/lib/orders";
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

// One type for both endings: a sentence to show, or the code of an order that
// now exists. The browser has work to do on success — emptying the cart — so
// the action reports back rather than redirecting out from under it.
export type CheckoutState =
  | { message: string }
  | { code: string }
  | null;

// The delivery details, as they arrive. Trimmed rather than trusted: a form is
// a public POST endpoint and the browser's `required` is a courtesy to the
// person filling it in, not a check.
const FIELDS = ["fullName", "phone", "city", "district", "address"] as const;

const LABELS: Record<(typeof FIELDS)[number], string> = {
  fullName: "Ad soyad",
  phone: "Telefon",
  city: "İl",
  district: "İlçe",
  address: "Adres",
};

export async function placeOrder(
  cart: unknown,
  _previous: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()])
  ) as Record<(typeof FIELDS)[number], string>;

  const missing = FIELDS.find((field) => values[field] === "");

  if (missing) {
    return { message: `${LABELS[missing]} alanını doldurun.` };
  }

  // Turkish mobile numbers are ten digits after the leading zero, and people
  // write them with spaces, dashes and brackets. The digits are what matters;
  // the shape they were typed in is not.
  const digits = values.phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return { message: "Telefon numaranızı kontrol edin." };
  }

  const items = readCart(cart);

  if (items.length === 0) {
    return { message: "Sepetiniz boş görünüyor." };
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
    return { message: turkishOrderError(error) };
  }

  // Stock has moved, so every page that quotes it is stale.
  revalidatePath("/", "layout");

  // No redirect here on purpose: the browser still has to empty the cart, and
  // it must not do that until the order is known to exist.
  return { code };
}
