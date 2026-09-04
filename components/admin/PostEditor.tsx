"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  createPost,
  updatePost,
  type PostResult,
} from "@/app/admin/blog/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { coverImageUrl } from "@/lib/posts";
import { createBrowserSupabase } from "@/lib/supabase-browser";

// Writing a post.
//
// The cover is uploaded straight from the browser to Storage, because the file
// never needs to touch our server — the bucket's policy already asks whether
// this session is the administrator. What the form submits is the path it
// landed at, not the file.

const FIELD =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-ink";

const BUTTON =
  "rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted";

export function PostEditor({
  post,
}: {
  // Absent when writing a new one.
  post?: { id: number; title: string; body: string; coverImage: string | null };
}) {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabase());

  const [cover, setCover] = useState<string | null>(post?.coverImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [state, formAction] = useActionState<PostResult, FormData>(
    post ? updatePost.bind(null, post.id) : createPost,
    null
  );

  // A new post leaves the form behind once it exists; an edit stays put, since
  // she may well keep editing.
  useEffect(() => {
    if (state?.ok && state.slug) router.push("/admin/blog");
  }, [state, router]);

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);

    // Named by time rather than by the file's own name: two photos called
    // IMG_0001.jpg would otherwise be one photo.
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(path, file, { upsert: false });

    setUploading(false);

    if (error) {
      setUploadError("Görsel yüklenemedi. Lütfen tekrar deneyin.");
      return;
    }

    setCover(path);
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {/* What the action actually stores — the path, set by the upload above. */}
      <input type="hidden" name="cover_image" value={cover ?? ""} />

      <label className="text-sm">
        <span className="text-muted">Başlık</span>
        <input
          name="title"
          required
          defaultValue={post?.title}
          placeholder="Örn. Kılıçlar Ası ne anlatır?"
          className={`${FIELD} mt-1`}
        />
      </label>

      <div className="text-sm">
        <span className="text-muted">Kapak görseli</span>

        {cover ? (
          <div className="relative mt-2 aspect-[3/2] overflow-hidden rounded-2xl bg-sand">
            <Image
              src={coverImageUrl(cover)}
              alt=""
              fill
              sizes="(min-width: 768px) 42rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
            className="text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-cream file:px-4 file:py-2 file:text-sm file:text-ink"
          />
          {cover ? (
            <button
              type="button"
              onClick={() => setCover(null)}
              className="rounded-full border border-line px-4 py-1.5 text-xs transition-colors hover:border-ink"
            >
              Kaldır
            </button>
          ) : null}
        </div>

        <p role="alert" className={`mt-2 text-sm text-brass ${uploadError ? "" : "sr-only"}`}>
          {uploadError ?? ""}
        </p>
        {uploading ? <p className="mt-2 text-sm text-muted">Yükleniyor…</p> : null}
      </div>

      <label className="text-sm">
        <span className="text-muted">Yazı</span>
        <textarea
          name="body"
          rows={16}
          defaultValue={post?.body}
          placeholder="Paragrafları bir boş satırla ayırın."
          className={`${FIELD} mt-1 leading-relaxed`}
        />
      </label>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${state ? (state.ok ? "text-ink" : "text-brass") : "sr-only"}`}
      >
        {state?.message ?? ""}
      </p>

      <div className="flex gap-3">
        <SubmitButton pendingLabel="Kaydediliyor…" className={BUTTON}>
          {post ? "Değişiklikleri kaydet" : "Yayımla"}
        </SubmitButton>
      </div>
    </form>
  );
}
