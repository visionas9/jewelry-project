import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductGallery } from "./ProductGallery";

// Still a server component. Only the gallery below opts into the client.
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;

  return (
    <article className="group">
      <ProductGallery
        images={product.images}
        name={product.name}
        href={href}
      />

      <div className="mt-4 flex items-start justify-between gap-4">
        <h2 className="font-display text-lg leading-snug font-medium">
          <Link href={href} className="transition-colors hover:text-brass">
            {product.name}
          </Link>
        </h2>
        <p className="shrink-0 text-sm text-muted tabular-nums">
          {product.price.toLocaleString("tr-TR")} {product.currency}
        </p>
      </div>
    </article>
  );
}
