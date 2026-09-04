// What the stock screen needs to read a product.
//
// Deliberately thin: the panel does not add, edit or remove products — that is
// rare enough not to be worth a screen — so this is only what a shelf count
// needs beside it. The stone vocabulary lives in lib/stones.ts, where the shop
// side already uses it.

export const PRODUCT_COLUMNS = "id, slug, name, stock, images";

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  stock: number;
  images: string[];
};

export function toAdminProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    stock: Number(row.stock),
    images: (row.images as string[] | null) ?? [],
  };
}
