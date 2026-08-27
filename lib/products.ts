import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import type { Product, Stone } from "@/types/product";

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

// --- Search & filter -------------------------------------------------------

export type ProductFilters = {
  query?: string;
  stone?: Stone;
};

// `%` and `_` are wildcards in ilike, and `\` escapes them. Left raw, a search
// for "%" would match every product. Escape them so user input is only ever
// treated as literal text.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// The JS half of tr_normalize() in the migration. Both sides must agree:
// Turkish İ/ı folded onto ASCII i first, then lowercased, then diacritics
// stripped, so "inci" finds "İnci" and "tas" finds "Taş".
function normalizeSearch(value: string) {
  return value
    .replace(/\u0130/g, "I")
    .replace(/\u0131/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function getFilteredProducts(
  filters: ProductFilters
): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  // Filtering happens in Postgres, not over a JS array. With six products
  // either would work; the difference shows up at a few thousand, where
  // shipping the whole table to filter it in memory stops being an option.
  let request = supabase
    .from("products")
    .select(COLUMNS)
    .order("id", { ascending: true });

  if (filters.stone) {
    request = request.eq("stone", filters.stone);
  }

  if (filters.query) {
    // Matched against `search_text`, the normalised copy of the name — see
    // supabase/migrations/0001_search_text.sql. The query has to go through the
    // same normalisation or the two sides won't agree.
    //
    // Name only. Descriptions want real full-text search (tsvector + an index)
    // rather than a wildcard scan — worth adding when the catalog grows.
    const term = escapeLike(normalizeSearch(filters.query));
    request = request.like("search_text", `%${term}%`);
  }

  const { data, error } = await request.returns<ProductRow[]>();

  if (error) {
    throw new Error(`Ürünler filtrelenemedi: ${error.message}`);
  }

  return data.map(toProduct);
}
