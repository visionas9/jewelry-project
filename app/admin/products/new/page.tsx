import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ProductEditor } from "@/components/admin/ProductEditor";
import { requireVerifiedAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "Yeni ürün",
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={null}>
        <NewProduct />
      </Suspense>
    </section>
  );
}

async function NewProduct() {
  await requireVerifiedAdmin();

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Ürünler
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">Yeni ürün</h1>
      <ProductEditor />
    </>
  );
}
