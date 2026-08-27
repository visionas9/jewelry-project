import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import type { Product } from "@/types/product";

// Every Supabase query for products lives here. Pages import these functions,
// never the client directly — one place to change if the storage layer moves.

const COLUMNS =
  "id, slug, name, price, currency, category, stone, description, material, size, stock, images, created_at";

// The row as Postgres returns it: snake_case, straight off the table.
type ProductRow = {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency: Product["currency"];
  category: Product["category"];
  stone: Product["stone"];
  description: string;
  material: string;
  size: string;
  stock: number;
  images: string[];
  created_at: string;
};

function toProduct(row: ProductRow): Product {
  const { created_at, ...rest } = row;
  return { ...rest, createdAt: created_at };
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("days");
  cacheTag("products");

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .order("id", { ascending: true })
    .returns<ProductRow[]>();

  if (error) {
    throw new Error(`Ürünler yüklenemedi: ${error.message}`);
  }

  return data.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("days");
  cacheTag("products");

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle<ProductRow>();

  // maybeSingle() returns data: null for "no match" rather than erroring,
  // so a real error here means the query itself failed.
  if (error) {
    throw new Error(`Ürün yüklenemedi (${slug}): ${error.message}`);
  }

  return data ? toProduct(data) : null;
}

// Only the slugs — generateStaticParams doesn't need the rest of the row.
export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag("products");

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .returns<{ slug: string }[]>();

  if (error) {
    throw new Error(`Ürün adresleri yüklenemedi: ${error.message}`);
  }

  return data.map((row) => row.slug);
}
