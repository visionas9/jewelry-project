import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sepet",
  description: "Sepetindeki bileklikler.",
};

export default function CartPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-4xl font-medium md:text-5xl">Sepet</h1>
      <p className="mt-4 max-w-md text-muted">
        Sepet Faz 5&apos;te buraya gelecek.
      </p>
    </section>
  );
}
