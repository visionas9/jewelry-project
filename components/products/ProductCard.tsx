import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/format";
import { QuickAdd } from "@/components/cart/QuickAdd";
import { ProductGallery } from "./ProductGallery";

// Still a server component. Only the gallery below opts into the client.
export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;

  return (
    <article className="group">
      {/* The gallery keeps its own link and arrows; the button sits beside
          them rather than inside, so there is never a button within a link. */}
      <div className="relative">
        <ProductGallery
          images={product.images}
          name={product.name}
          href={href}
        />
        <QuickAdd
          productId={product.id}
          name={product.name}
          stock={product.stock}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h2 className="font-display text-lg leading-snug font-medium">
          <Link href={href} className="transition-colors hover:text-clay">
            {product.name}
          </Link>
        </h2>
        <p className="shrink-0 text-sm text-muted tabular-nums">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}
