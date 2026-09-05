import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findLegalDocument, LEGAL_DOCUMENTS } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/legal/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const document = findLegalDocument(slug);

  if (!document) return { title: "Sayfa bulunamadı" };

  return {
    title: document.title,
    description: document.description,
    // A draft has placeholder text where the terms belong. Indexing that would
    // put a promise we have not written yet in front of a search result.
    robots: document.draft ? { index: false } : undefined,
  };
}

export default async function LegalPage(props: PageProps<"/legal/[slug]">) {
  const { slug } = await props.params;
  const document = findLegalDocument(slug);

  if (!document) notFound();

  return (
    <article className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl leading-tight md:text-4xl">
        {document.title}
      </h1>

      {document.draft ? (
        <p className="mt-6 rounded-2xl border border-line bg-sand px-5 py-4 text-sm leading-relaxed text-muted">
          Bu metnin hazırlık çalışmaları sürmektedir. Yayımlanana kadar
          buradaki başlıklar yalnızca içeriğin kapsamını göstermektedir.
          Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-8">
        {document.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-sm leading-relaxed text-muted"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
