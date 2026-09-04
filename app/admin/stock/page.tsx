import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { StockRow } from "@/components/admin/StockRow";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { PRODUCT_COLUMNS, toAdminProduct } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Stok",
  robots: { index: false, follow: false },
};

export default function AdminStockPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={<Placeholder />}>
        <Stock />
      </Suspense>
    </section>
  );
}

async function Stock() {
  const supabase = await requireVerifiedAdmin();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    // Whatever has run out first: it is the reason to open this page.
    .order("stock", { ascending: true })
    .order("name", { ascending: true });

  const products = (data ?? []).map(toAdminProduct);
  const out = products.filter((product) => product.stock === 0).length;

  return (
    <>
      <h1 className="font-display text-3xl md:text-4xl">Stok</h1>

      <div className="mt-6">
        <AdminNav active="/admin/stock" />
      </div>

      <p className="mt-6 text-sm text-muted">
        {out === 0
          ? "Tükenen ürün yok."
          : `${out} ürün tükendi — listenin başında.`}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {products.map((product) => (
          <StockRow key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-1/3 rounded-full bg-sand" />
      <div className="mt-6 h-9 w-full rounded-full bg-sand" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-16 w-full rounded-2xl bg-sand" />
        <div className="h-16 w-full rounded-2xl bg-sand" />
        <div className="h-16 w-full rounded-2xl bg-sand" />
      </div>
    </div>
  );
}
