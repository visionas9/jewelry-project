// Next 16: `params` is a Promise — it has to be awaited.

import { ProductDynamic } from "@/components/products/ProductDynamic";
import { products } from "@/data/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export const metadata: Metadata = {
  title: "...",
  description: "...",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return;

  const selectedProduct = products.find((p) => p.slug === slug);

  if (!selectedProduct) notFound();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <ProductDynamic product={selectedProduct} />
    </section>
  );
}
