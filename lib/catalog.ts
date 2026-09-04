// The fixed vocabularies the products table already enforces.
//
// Repeated here so the panel can offer them as a list rather than a text field
// somebody has to spell correctly — the check constraints in 0000_products.sql
// are the real rule, and these keep the form from ever violating one.

export const CATEGORIES = ["bileklik"] as const;

export const STONES = [
  "kuvars",
  "inci",
  "lapis",
  "rodonit",
  "akik",
  "turmalin",
] as const;

export type Stone = (typeof STONES)[number];

// Shown with a capital, stored lowercase — the constraint is on the stored
// value, and "Kuvars" would fail it.
export function stoneLabel(stone: string): string {
  return stone.charAt(0).toUpperCase() + stone.slice(1);
}

export function isKnownStone(value: string): value is Stone {
  return (STONES as readonly string[]).includes(value);
}

export const PRODUCT_COLUMNS =
  "id, slug, name, price, category, stone, description, material, size, stock, images";

export type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  category: string;
  stone: string;
  description: string;
  material: string;
  size: string;
  stock: number;
  images: string[];
};

export function toAdminProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    price: Number(row.price),
    category: String(row.category),
    stone: String(row.stone),
    description: String(row.description ?? ""),
    material: String(row.material ?? ""),
    size: String(row.size ?? ""),
    stock: Number(row.stock),
    images: (row.images as string[] | null) ?? [],
  };
}
