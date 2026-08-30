import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hoş geldiniz",
  // Nobody should reach this from a search result — it only makes sense
  // immediately after clicking a confirmation link.
  robots: { index: false },
};

export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16 md:px-8 md:py-24">
      <h1 className="font-display text-3xl">E-postanız doğrulandı</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Hesabınız hazır. Sepetinizdekiler olduğu gibi duruyor.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Bilekliklere göz at
        </Link>
        <Link
          href="/cart"
          className="rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
        >
          Sepete git
        </Link>
      </div>
    </div>
  );
}
