// Next 16: `params` is a Promise — it has to be awaited.

import { Suspense } from "react";
import { ProductDetail } from "@/components/products/ProductDetail";
import { ProductDetailSkeleton } from "@/components/products/ProductDetailSkeleton";
import { getProductBySlug, getProductSlugs } from "@/lib/products";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
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
  // Same call the page makes below. It's cached, so this costs one query, not two.
  const product = await getProductBySlug(slug);

  // Runs before the page's notFound(), so an unknown slug has to be handled here too.
  if (!product) {
    return { title: "Bileklik bulunamadı" };
  }

  const description = truncate(product.description);
  // The root layout's template turns this into "<name> · ishin denshin".
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

// Everything that depends on the slug lives here, behind the Suspense boundary
// below. Cache Components prerenders a shell for slugs that weren't built ahead
// of time; that shell can't know the slug, so calling notFound() outside a
// boundary would break it. Inside one, the shell renders the fallback and this
// resolves at request time instead.
async function ProductDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const selectedProduct = await getProductBySlug(slug);

  if (!selectedProduct) notFound();

  return <ProductDetail product={selectedProduct} />;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent params={params} />
      </Suspense>
    </section>
  );
}
