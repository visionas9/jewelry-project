"use server";

import { revalidatePath } from "next/cache";

import { turkishTransitionError } from "@/lib/admin-orders";
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

  // Stock and status both moved, so the list and this order's page are stale.
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${code}`);

  return { ok: true, message: DONE[intent] };
}
