import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DeleteProduct } from "@/components/admin/DeleteProduct";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { PRODUCT_COLUMNS, toAdminProduct } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Ürünü düzenle",
  robots: { index: false, follow: false },
};

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={null}>
        <EditProduct params={props.params} />
      </Suspense>
    </section>
  );
}

async function EditProduct({
  params,
}: {
  params: PageProps<"/admin/products/[id]">["params"];
}) {
  const { id } = await params;
  const supabase = await requireVerifiedAdmin();

  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", Number(id))
    .maybeSingle();

  if (!data) notFound();

  const product = toAdminProduct(data);

  return (
    <>
      <Link
        href="/admin/products"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Ürünler
      </Link>

      <h1 className="mt-4 font-display text-3xl md:text-4xl">{product.name}</h1>
      <p className="mt-2 text-sm text-muted">
        <Link
          href={`/products/${product.slug}`}
          className="underline underline-offset-4 hover:text-ink"
        >
          /products/{product.slug}
        </Link>
      </p>

      <ProductEditor product={product} />

      <DeleteProduct id={product.id} />
    </>
  );
}
