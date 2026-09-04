import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { formatDate } from "@/lib/format";
import { POST_COLUMNS, toPost } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

export default function AdminBlogPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={<Placeholder />}>
        <Posts />
      </Suspense>
    </section>
  );
}

async function Posts() {
  const supabase = await requireVerifiedAdmin();

  const { data } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("published_at", { ascending: false });

  const posts = (data ?? []).map(toPost);

  return (
    <>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl md:text-4xl">Blog</h1>
      </header>

      <div className="mt-6">
        <AdminNav active="/admin/blog" />
      </div>

      <Link
        href="/admin/blog/new"
        className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay"
      >
        Yeni yazı
      </Link>

      {posts.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          Henüz yazı yok. İlkini yazmak için “Yeni yazı”ya dokunun.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/blog/${post.id}`}
                className="block rounded-2xl border border-line bg-cream px-5 py-4 transition-colors hover:border-ink"
              >
                <p className="font-display text-lg">{post.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(post.publishedAt)} · /blog/{post.slug}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-1/3 rounded-full bg-sand" />
      <div className="mt-6 h-9 w-full rounded-full bg-sand" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-20 w-full rounded-2xl bg-sand" />
        <div className="h-20 w-full rounded-2xl bg-sand" />
      </div>
    </div>
  );
}
