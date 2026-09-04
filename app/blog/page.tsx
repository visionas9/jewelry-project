import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate } from "@/lib/format";
import { coverImageUrl, POST_COLUMNS, toPost } from "@/lib/posts";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tarot üzerine notlar, kart yorumları ve okuma önerileri.",
};

// The session-free client, like the catalog: a blog post is the same for
// everybody, so nothing here should make the page per-visitor.
export default function BlogPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Blog</h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Tarot üzerine notlar, kart yorumları ve okuma önerileri.
      </p>

      <Suspense fallback={<Placeholder />}>
        <Posts />
      </Suspense>
    </section>
  );
}

async function Posts() {
  const { data } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("published_at", { ascending: false });

  const posts = (data ?? []).map(toPost);

  if (posts.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-line px-5 py-12 text-center text-sm text-muted">
        Henüz yazı yok. Yakında burada olacak.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid gap-8 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/blog/${post.slug}`} className="group block">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-sand">
              {post.coverImage ? (
                <Image
                  src={coverImageUrl(post.coverImage)}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : null}
            </div>
            <p className="mt-4 text-xs text-muted">
              {formatDate(post.publishedAt)}
            </p>
            <h2 className="mt-1 font-display text-xl transition-colors group-hover:text-brass md:text-2xl">
              {post.title}
            </h2>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="mt-10 grid gap-8 sm:grid-cols-2">
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className="animate-pulse">
          <div className="aspect-[3/2] rounded-2xl bg-sand" />
          <div className="mt-4 h-3 w-24 rounded-full bg-sand" />
          <div className="mt-2 h-5 w-2/3 rounded-full bg-sand" />
        </div>
      ))}
    </div>
  );
}
