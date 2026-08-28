import Image from "next/image";
import Link from "next/link";
import { HomeSearch } from "@/components/search/HomeSearch";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      {/* Hero — stacked on phones, two columns from md up. */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div className="flex flex-col items-start gap-6">
            <p className="text-xs tracking-[0.25em] text-brass uppercase">
              El emeği · Gerçek taş
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
              Bilekliklere göz at
            </Link>

            {/* Sends you to /products with the term applied — the home page
                deliberately shows no results of its own, so there is one
                results page to design and maintain. */}
            <div className="w-full max-w-sm">
              {/* Normal case, not the tracked-caps eyebrow used elsewhere — a
                  full question set in spaced capitals reads like shouting. */}
              <p className="mb-2 text-sm text-muted">
                Ya da aklında bir şey var mı?
              </p>
              <HomeSearch />
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand md:aspect-[3/4]">
            <Image
              src="/images/lapis-blue-1.jpg"
              alt="Lapis taşlı el yapımı bileklik"
              fill
              preload
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
              title: "Tek tek, elle",
              body: "Her bileklik tek tek elde diziliyor. Makine yok, acele yok.",
            },
            {
              title: "Taşlar gerçek",
              body: "Lapis, gül kuvars, rodonit… Hepsi gerçek taş — boyalı cam değil, söz.",
            },
            {
              title: "Az ve öz",
              body: "Her modelden az sayıda yapılıyor. Beğendiğin varsa bekletmemekte fayda var.",
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
