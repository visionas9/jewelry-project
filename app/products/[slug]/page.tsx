// Next 16: `params` is a Promise — it has to be awaited.

import { ProductDetail } from "@/components/products/ProductDetail";
import { products } from "@/data/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return products.map((p) => ({
    slug: p.slug,
  }));
}

// Google cuts descriptions around 160 characters. Trim on a word boundary
// so a snippet never ends mid-word.
function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).trimEnd() + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);

  // Runs before the page's notFound(), so an unknown slug has to be handled here too.
  if (!product) {
    return { title: "Ürün bulunamadı" };
  }

  const description = truncate(product.description);
  // The root layout's template turns this into "<name> · Atölye Taş".
  const title = product.name;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
      url: `/products/${product.slug}`,
      images: product.images.map((src) => ({
        url: src,
        alt: product.name,
      })),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const selectedProduct = products.find((p) => p.slug === slug);

  if (!selectedProduct) notFound();

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <ProductDetail product={selectedProduct} />
    </section>
  );
}
