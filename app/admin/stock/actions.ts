"use server";

import { revalidatePath } from "next/cache";

import { NOT_SAVED, wroteNothing } from "@/lib/admin-write";
import { createServerSupabase } from "@/lib/supabase-server";

// Setting a stock count, from the stock screen.
//
// The only catalog write the panel makes. Adding and removing products is rare
// enough that it is not worth a screen — the shelf count is the thing that
// changes every week.
//
// Same shape as the other panel actions: the server re-establishes that the
// caller is the administrator, and the products policy refuses the write again
// regardless.

export type StockResult = { ok: boolean; message: string } | null;

export async function setStock(
  id: number,
  _previous: StockResult,
  formData: FormData
): Promise<StockResult> {
  const supabase = await createServerSupabase();
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (isAdmin !== true) {
    return { ok: false, message: "Bu işlemi yapma yetkiniz yok." };
  }

  const stock = Math.floor(Number(formData.get("stock")));

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, message: "Stok 0 veya daha büyük olmalı." };
  }

  const { data, error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Stok kaydedilemedi. Lütfen tekrar deneyin." };
  }

  // A write the policy refused comes back with no error and no row — see
  // lib/admin-write.ts. Without this it would report success and change
  // nothing.
  if (wroteNothing(error, data)) return { ok: false, message: NOT_SAVED };

  // Stock appears on nearly every page, so one change makes most of the site
  // stale at once.
  revalidatePath("/", "layout");
  if (data?.slug) revalidatePath(`/products/${data.slug}`);

  return { ok: true, message: `Stok ${stock} olarak kaydedildi.` };
}
