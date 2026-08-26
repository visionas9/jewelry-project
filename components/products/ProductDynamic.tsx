import type { Product } from "@/types/product";
import Image from "next/image";

// Still a server component. Only the gallery below opts into the client.
export function ProductDynamic({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;

  return (
    <article className="flex">
      <Image
        src={product.images[0]}
        alt={product.name}
        width={400}
        height={400}
      />

      <div className="mt-4 flex flex-col items-start justify-between gap-4">
        <h2 className="font-display text-lg leading-snug font-medium">
          {product.name}
        </h2>
        <p className="shrink-0 text-sm text-muted tabular-nums">
          {product.price.toLocaleString("tr-TR")} {product.currency}
        </p>
        <p>{product.description}</p>
        <p>{product.material}</p>
        <p>{product.size}</p>
        <p>{product.stone}</p>
      </div>
    </article>
  );
}
