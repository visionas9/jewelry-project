import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PostEditor } from "@/components/admin/PostEditor";
import { requireVerifiedAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "Yeni yazı",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={null}>
        <NewPost />
      </Suspense>
    </section>
  );
}

async function NewPost() {
  await requireVerifiedAdmin();

  return (
    <>
      <Link
        href="/admin/blog"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Blog
      </Link>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">Yeni yazı</h1>
      <PostEditor />
    </>
  );
}
