import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatDate } from "@/lib/format";
import { coverImageUrl, paragraphs, POST_COLUMNS, toPost } from "@/lib/posts";
import { supabase } from "@/lib/supabase";

async function readPost(slug: string) {
  const { data } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  return data ? toPost(data) : null;
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await readPost(slug);

  if (!post) return { title: "Yazı bulunamadı" };

  return {
    title: post.title,
    // The opening lines, which is what a preview is for. Trimmed rather than
    // cut mid-word.
    description: paragraphs(post.body)[0]?.slice(0, 155),
    openGraph: post.coverImage
      ? { images: [coverImageUrl(post.coverImage)] }
      : undefined,
  };
}

export default function PostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <Suspense fallback={<Placeholder />}>
        <PostBody params={props.params} />
      </Suspense>
    </article>
  );
}

async function PostBody({
  params,
}: {
  params: PageProps<"/blog/[slug]">["params"];
}) {
  const { slug } = await params;
  const post = await readPost(slug);

  if (!post) notFound();

  return (
    <>
      <Link
        href="/blog"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Blog
      </Link>

      <p className="mt-6 text-xs text-muted">{formatDate(post.publishedAt)}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
        {post.title}
      </h1>

      {post.coverImage ? (
        <div className="relative mt-8 aspect-[3/2] overflow-hidden rounded-2xl bg-sand">
          <Image
            src={coverImageUrl(post.coverImage)}
            alt=""
            fill
            sizes="(min-width: 768px) 42rem, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {/* Rendered as text, never as markup. React escapes what it renders, so a
          post body is not a place where a script can end up running. */}
      <div className="mt-8 flex flex-col gap-5">
        {paragraphs(post.body).map((paragraph, index) => (
          <p key={index} className="leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-3 w-20 rounded-full bg-sand" />
      <div className="mt-6 h-9 w-3/4 rounded-full bg-sand" />
      <div className="mt-8 aspect-[3/2] rounded-2xl bg-sand" />
      <div className="mt-8 h-4 w-full rounded-full bg-sand" />
      <div className="mt-3 h-4 w-5/6 rounded-full bg-sand" />
    </div>
  );
}
