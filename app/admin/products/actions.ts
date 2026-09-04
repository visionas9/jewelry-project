"use server";

import { revalidatePath } from "next/cache";

import { NOT_SAVED, wroteNothing } from "@/lib/admin-write";
import { isKnownStone } from "@/lib/catalog";
import { slugify } from "@/lib/slug";
import { createServerSupabase } from "@/lib/supabase-server";

// Editing the catalog, from the panel.
//
// Same shape as the order and blog actions: the server re-establishes that the
// caller is the administrator, and the products policy refuses the write again
// regardless.

export type CatalogResult = { ok: boolean; message: string } | null;

const FORBIDDEN = "Bu işlemi yapma yetkiniz yok.";
const GENERIC = "Ürün kaydedilemedi. Lütfen birazdan tekrar deneyin.";

async function asAdmin() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("is_admin");

  return { supabase, ok: data === true };
}

// Stock and price appear on nearly every page, so a change here makes most of
// the site stale at once.
function refresh(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/products/${slug}`);
}

type Fields = {
  name: string;
  price: number;
  stone: string;
  description: string;
  material: string;
  size: string;
  stock: number;
  images: string[];
};

function readFields(formData: FormData): Fields | string {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const stone = String(formData.get("stone") ?? "").trim();
  const stock = Math.floor(Number(formData.get("stock")));

  if (name === "") return "Ürün adı gerekli.";
  if (!Number.isFinite(price) || price < 0) return "Geçerli bir fiyat girin.";
  // The database constrains this too; caught here so the message names the
  // field rather than arriving as a constraint violation.
  if (!isKnownStone(stone)) return "Listedeki taşlardan birini seçin.";
  if (!Number.isInteger(stock) || stock < 0) return "Stok 0 veya daha büyük olmalı.";

  return {
    name,
    price,
    stone,
    stock,
    description: String(formData.get("description") ?? "").trim(),
    material: String(formData.get("material") ?? "").trim(),
    size: String(formData.get("size") ?? "").trim(),
    // One path or URL per line, in the order they should appear.
    images: String(formData.get("images") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== ""),
  };
}

export async function createProduct(
  _previous: CatalogResult,
  formData: FormData
): Promise<CatalogResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const fields = readFields(formData);
  if (typeof fields === "string") return { ok: false, message: fields };

  // Generated once from the name, like a post's. A product URL that changes
  // because a name was tidied is a link somebody already shared, broken.
  const base = slugify(fields.name);
  let slug = base;

  for (let attempt = 2; attempt <= 50; attempt += 1) {
    const { data: taken } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!taken) break;
    slug = `${base}-${attempt}`;
  }

  const { error } = await supabase
    .from("products")
    .insert({ ...fields, slug, category: "bileklik" });

  if (error) return { ok: false, message: GENERIC };

  refresh(slug);

  return { ok: true, message: "Ürün eklendi." };
}

export async function updateProduct(
  id: number,
  _previous: CatalogResult,
  formData: FormData
): Promise<CatalogResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const fields = readFields(formData);
  if (typeof fields === "string") return { ok: false, message: fields };

  const { data, error } = await supabase
    .from("products")
    .update(fields)
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, message: GENERIC };
  if (wroteNothing(error, data)) return { ok: false, message: NOT_SAVED };

  refresh(data?.slug);

  return { ok: true, message: "Ürün güncellendi." };
}

export async function deleteProduct(
  id: number,
  _previous: CatalogResult
): Promise<CatalogResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    // order_items references products with ON DELETE RESTRICT, so a bracelet
    // somebody has already bought cannot be removed — and should not be, or the
    // order it belongs to loses what was in it.
    return {
      ok: false,
      message:
        "Bu ürün silinemez: geçmiş siparişlerde yer alıyor. Stoğunu 0 yapabilirsiniz.",
    };
  }

  if (wroteNothing(error, data)) return { ok: false, message: NOT_SAVED };

  refresh(data?.slug);

  return { ok: true, message: "Ürün silindi." };
}

// Just the number, from the stock screen. Separate from updateProduct because
// that is the whole point of that screen: one field, one tap, no form to read.
export async function setStock(
  id: number,
  _previous: CatalogResult,
  formData: FormData
): Promise<CatalogResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

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

  if (error) return { ok: false, message: GENERIC };
  if (wroteNothing(error, data)) return { ok: false, message: NOT_SAVED };

  refresh(data?.slug);

  return { ok: true, message: `Stok ${stock} olarak kaydedildi.` };
}
