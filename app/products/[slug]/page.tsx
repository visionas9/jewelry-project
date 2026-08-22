// Next 16: `params` is a Promise — it has to be awaited.
// This is a routing placeholder. The real detail page (data + gallery) is Phase 3.
export default async function ProductDetailPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;

  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">{slug}</h1>
      <p className="mt-4 max-w-md text-muted">
        Ürün detayı Faz 3&apos;te buraya gelecek.
      </p>
    </section>
  );
}
