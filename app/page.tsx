import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* Hero — stacked on phones, two columns from md up. */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div className="flex flex-col items-start gap-6">
            <p className="text-xs tracking-[0.25em] text-brass uppercase">
              El yapımı · Doğal taş
            </p>
            <h1 className="font-display text-4xl leading-[1.1] font-medium text-balance md:text-6xl">
              Her taşın kendi hikâyesi var
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted md:text-lg">
              {SITE.description}
            </p>
            <Link
              href="/products"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
            >
              Bileklikleri gör
            </Link>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand md:aspect-[3/4]">
            <Image
              src="/images/lapis-blue-1.jpg"
              alt="Lapis taşlı el yapımı bileklik"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Three short promises. Stacked on phones, a row from md up. */}
      <section className="border-y border-line bg-sand">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3 md:gap-12 md:px-8 md:py-16">
          {[
            {
              title: "Elde diziliyor",
              body: "Her bileklik tek tek, elde diziliyor. Seri üretim yok.",
            },
            {
              title: "Gerçek doğal taş",
              body: "Lapis, gül kuvars, rodonit — hepsi gerçek taş, boyalı cam değil.",
            },
            {
              title: "Küçük üretim",
              body: "Az sayıda üretiliyor. Biten model her zaman geri gelmiyor.",
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <h2 className="font-display text-xl font-medium md:text-2xl">
                {item.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
