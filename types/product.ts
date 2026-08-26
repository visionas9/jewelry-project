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
};
