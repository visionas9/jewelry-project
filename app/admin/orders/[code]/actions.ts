"use server";

import { revalidatePath } from "next/cache";

import { turkishTransitionError } from "@/lib/admin-orders";
import {
  orderDeliveredEmail,
  orderPaidEmail,
  orderShippedEmail,
} from "@/lib/order-emails";
import { sendEmail } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";

// Moving an order along, from the panel.
//
// One action for all four moves, told apart by an `intent` field. Whichever it
// is, the same two things happen first: the server re-establishes that the
// caller is the administrator, and then a database function refuses it again
// regardless. A page that forgot to guard still fails here; a request that got
// past here still fails at the database.

// What the client shows after an action: a sentence, and whether it went well.
// aria-live reads it out either way.
export type ActionResult = { ok: boolean; message: string } | null;

export type Intent = "paid" | "shipped" | "delivered" | "cancel";

const FORBIDDEN = "Bu işlemi yapma yetkiniz yok.";

const DONE: Record<Intent, string> = {
  paid: "Ödeme alındı olarak işaretlendi.",
  shipped: "Kargoya verildi olarak işaretlendi.",
  delivered: "Teslim edildi olarak işaretlendi.",
  cancel: "Sipariş iptal edildi, stok geri eklendi.",
};

export async function perform(
  code: string,
  _previous: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const intent = String(formData.get("intent") ?? "") as Intent;

  // Re-established on the server, every time. Not trusted from the page that
  // rendered the button.
  const supabase = await createServerSupabase();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return { ok: false, message: FORBIDDEN };

  // Where it stood before, so an email only goes out on a real move. The
  // transition functions are deliberately idempotent — marking a paid order
  // paid again succeeds and changes nothing — and a buyer must not be told
  // twice because a button was pressed twice.
  const { data: before } = await supabase
    .from("orders")
    .select("status")
    .eq("code", code)
    .maybeSingle();

  let error: unknown = null;

  if (intent === "paid") {
    ({ error } = await supabase.rpc("mark_paid", { order_code: code }));
  } else if (intent === "shipped") {
    const carrier = String(formData.get("carrier") ?? "").trim();
    const tracking = String(formData.get("tracking_number") ?? "").trim();

    // Caught here as well as in the database, so the message lands beside the
    // fields rather than after a round trip that was never going to succeed.
    if (carrier === "" || tracking === "") {
      return { ok: false, message: "Kargo firması ve takip numarası gerekli." };
    }

    ({ error } = await supabase.rpc("mark_shipped", {
      order_code: code,
      carrier,
      tracking_number: tracking,
    }));
  } else if (intent === "delivered") {
    ({ error } = await supabase.rpc("mark_delivered", { order_code: code }));
  } else if (intent === "cancel") {
    ({ error } = await supabase.rpc("cancel_order", { order_code: code }));
  } else {
    return { ok: false, message: turkishTransitionError(null) };
  }

  if (error) return { ok: false, message: turkishTransitionError(error) };

  // Stock and status both moved, so the list and this order's page are stale —
  // and so is the buyer's own copy of it.
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${code}`);
  revalidatePath(`/orders/${code}`);

  // Every move except a cancellation is worth an email, and only when the order
  // actually arrived there just now. Nothing is sent for a cancellation — a
  // buyer should not be told about something that was undone.
  if (intent !== "cancel" && before?.status !== intent) {
    await announce(supabase, code, intent);
  }

  return { ok: true, message: DONE[intent] };
}

// Tells the buyer their order moved.
//
// Everything here happens after the change is committed, so nothing it does may
// throw: a mail service having a bad afternoon must not turn a completed
// transition into an error on her screen, or worse, look like it failed and
// invite a second press.
async function announce(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  code: string,
  intent: Exclude<Intent, "cancel">
) {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select(
        "code, total, full_name, carrier, tracking_number, order_items (quantity, unit_price, products (name))"
      )
      .eq("code", code)
      .maybeSingle();

    if (!order) return;

    // The buyer's address lives in auth.users, which only this function may
    // reach — and only because the caller is the administrator.
    const { data: to } = await supabase.rpc("order_buyer_email", {
      order_code: code,
    });

    if (typeof to !== "string" || to === "") return;

    const lines = (order.order_items ?? []).map((line) => {
      const product = Array.isArray(line.products) ? line.products[0] : line.products;

      return {
        name: (product as { name?: string } | null)?.name ?? "Ürün",
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
      };
    });

    const details = {
      code: order.code,
      total: Number(order.total),
      fullName: order.full_name,
      lines,
    };

    const mail =
      intent === "paid"
        ? orderPaidEmail(details)
        : intent === "delivered"
          ? orderDeliveredEmail(details)
          : orderShippedEmail(details, {
              carrier: order.carrier ?? "",
              trackingNumber: order.tracking_number ?? "",
            });

    await sendEmail({ to, ...mail });
  } catch (error) {
    console.error(`[email] could not announce ${intent} for ${code}`, error);
  }
}
