import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type OrderStatus } from "./orders";

// The order list, as the administrator sees it — every order, not just her own.
//
// The client passed in is the one guarded by requireAdmin(), so the "the
// administrator reads every order" policy is what returns these rows. A session
// that never passed a second factor would fall back to reading only its own
// orders, which is exactly why the page ahead of this refuses anything below
// aal2 rather than quietly showing a short list.

export type AdminOrder = {
  code: string;
  status: OrderStatus;
  total: number;
  buyer: string;
  itemCount: number;
  placedAt: string;
};

// A filter the URL can carry. "all" is the absence of a filter rather than a
// value the database knows about.
export type OrderFilter = OrderStatus | "all";

export async function listAllOrders(
  client: SupabaseClient,
  options: { filter?: OrderFilter; search?: string } = {}
): Promise<AdminOrder[]> {
  const filter = options.filter ?? "all";
  const search = options.search?.trim() ?? "";

  let query = client
    .from("orders")
    .select("code, status, total, full_name, created_at, order_items (quantity)")
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  // Partial and case-insensitive, so "1", "00001" and "is-00001" all find
  // IS-00001 — she reads a code off a bank statement and types what she sees.
  if (search !== "") {
    query = query.ilike("code", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Siparişler yüklenemedi: ${error.message}`);
  }

  const orders: AdminOrder[] = data.map((order) => ({
    code: order.code,
    status: order.status as OrderStatus,
    total: Number(order.total),
    buyer: order.full_name,
    itemCount: (order.order_items ?? []).reduce(
      (count: number, line: { quantity: number }) => count + line.quantity,
      0
    ),
    placedAt: order.created_at,
  }));

  // Only when nothing is filtered: the ones waiting for a transfer are the ones
  // she acts on, so they float to the top while everything stays newest-first
  // within. A stable sort keeps the date order the database already gave.
  if (filter === "all") {
    orders.sort(
      (a, b) => Number(b.status === "pending") - Number(a.status === "pending")
    );
  }

  return orders;
}

// The transition functions refuse in stable codes — see
// supabase/migrations/0009_order_transitions.sql. This is where those become
// Turkish, the same way turkishOrderError does for place_order.
export const GENERIC_ACTION_ERROR =
  "İşlem tamamlanamadı. Lütfen birazdan tekrar deneyin.";

export function turkishTransitionError(error: unknown): string {
  if (!error || typeof error !== "object") return GENERIC_ACTION_ERROR;

  const { message } = error as { message?: unknown };

  if (typeof message !== "string") return GENERIC_ACTION_ERROR;

  if (message.includes("invalid_transition")) {
    // The order moved under her — someone (or another tab) already changed it.
    // Refresh rather than force it, so she acts on the real state.
    return "Bu sipariş artık bu işlemi kabul etmiyor. Sayfayı yenileyip güncel durumu görün.";
  }

  if (message.includes("missing_tracking")) {
    return "Kargo firması ve takip numarası gerekli.";
  }

  if (message.includes("unknown_order")) {
    return "Sipariş bulunamadı.";
  }

  if (message.includes("forbidden")) {
    return "Bu işlemi yapma yetkiniz yok.";
  }

  return GENERIC_ACTION_ERROR;
}
