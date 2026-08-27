// Mirrors the `products` table in Supabase. The check constraints there keep
// these unions honest — the database rejects anything not in these lists.

export type Currency = "TRY";

export type Category = "bileklik";

export type Stone =
  | "kuvars"
  | "inci"
  | "lapis"
  | "rodonit"
  | "akik"
  | "turmalin";

export type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: Currency;
  category: Category;
  stone: Stone;
  description: string;
  material: string;
  size: string;
  stock: number;
  images: string[];
  createdAt: string;
};
