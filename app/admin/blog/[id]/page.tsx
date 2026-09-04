import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DeletePost } from "@/components/admin/DeletePost";
import { PostEditor } from "@/components/admin/PostEditor";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { POST_COLUMNS, toPost } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Yazıyı düzenle",
  robots: { index: false, follow: false },
};

export default function EditPostPage(props: PageProps<"/admin/blog/[id]">) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={null}>
        <EditPost params={props.params} />
      </Suspense>
    </section>
  );
}

async function EditPost({
  params,
}: {
  params: PageProps<"/admin/blog/[id]">["params"];
}) {
  const { id } = await params;
  const supabase = await requireVerifiedAdmin();

  const { data } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", Number(id))
    .maybeSingle();

  if (!data) notFound();

  const post = toPost(data);

  return (
    <>
      <Link
        href="/admin/blog"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Blog
      </Link>

      <h1 className="mt-4 font-display text-3xl md:text-4xl">Yazıyı düzenle</h1>
      {/* The address it already has. Editing the title does not move it, so it
          is worth being able to see where the post actually lives. */}
      <p className="mt-2 text-sm text-muted">
        <Link
          href={`/blog/${post.slug}`}
          className="underline underline-offset-4 hover:text-ink"
        >
          /blog/{post.slug}
        </Link>
      </p>

      <PostEditor post={post} />

      <DeletePost id={post.id} />
    </>
  );
}
