import Link from "next/link";
import type { Product } from "@/types/product";
import { AddToCart } from "@/components/cart/AddToCart";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "./ProductGallery";

// Server component. Only ProductGallery opts into the client, for its arrows.
export function ProductDetail({ product }: { product: Product }) {
  const inStock = product.stock > 0;

  const specs = [
    { label: "Taş", value: product.stone },
    { label: "Ölçü", value: product.size },
    { label: "Malzeme", value: product.material },
  ];

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="group lg:sticky lg:top-28 lg:self-start">
        <ProductGallery
          images={product.images}
          name={product.name}
          showDots
          priority
        />
      </div>

      <div className="lg:pt-2">
        <nav aria-label="Konum" className="text-sm text-muted">
          <Link href="/products" className="transition-colors hover:text-ink">
            Bileklikler
          </Link>
          <span aria-hidden="true" className="mx-2 text-line">
            /
          </span>
        </nav>

        <h1 className="mt-3 font-display text-3xl leading-tight font-medium md:text-4xl">
          {product.name}
        </h1>

        <p className="mt-4 text-xl tabular-nums">
          {formatPrice(product.price, product.currency)}
        </p>

        <p className="mt-2 text-sm text-muted">
          {inStock ? "Stokta var" : "Tükendi"}
        </p>

        <p className="mt-6 max-w-prose leading-relaxed text-muted">
          {product.description}
        </p>

        <AddToCart product={product} />

        <dl className="mt-8 border-t border-line text-sm">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="flex gap-6 border-b border-line py-3"
            >
              <dt className="w-24 shrink-0 text-muted">{spec.label}</dt>
              <dd className="first-letter:uppercase">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
