import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { PRODUCT_COLUMNS, stoneLabel, toAdminProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ürünler",
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={<Placeholder />}>
        <Products />
      </Suspense>
    </section>
  );
}

async function Products() {
  const supabase = await requireVerifiedAdmin();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("name", { ascending: true });

  const products = (data ?? []).map(toAdminProduct);

  return (
    <>
      <h1 className="font-display text-3xl md:text-4xl">Ürünler</h1>

      <div className="mt-6">
        <AdminNav active="/admin/products" />
      </div>

      <Link
        href="/admin/products/new"
        className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
      >
        Yeni ürün
      </Link>

      {products.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          Henüz ürün yok.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-cream px-4 py-3 transition-colors hover:border-ink"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{product.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {stoneLabel(product.stone)} ·{" "}
                    <span className={product.stock === 0 ? "text-brass" : ""}>
                      {product.stock === 0 ? "Tükendi" : `Stok ${product.stock}`}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatPrice(product.price, "TRY")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-1/3 rounded-full bg-sand" />
      <div className="mt-6 h-9 w-full rounded-full bg-sand" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-20 w-full rounded-2xl bg-sand" />
        <div className="h-20 w-full rounded-2xl bg-sand" />
      </div>
    </div>
  );
}
