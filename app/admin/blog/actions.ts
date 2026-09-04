"use server";

import { revalidatePath } from "next/cache";

import { slugify } from "@/lib/slug";
import { createServerSupabase } from "@/lib/supabase-server";

// Writing the blog, from the panel.
//
// Same shape as the order actions: the server re-establishes that the caller is
// the administrator, and the posts policy refuses the write again regardless. A
// page that forgot to guard still fails here; a request past here still fails
// at the database.

export type PostResult = { ok: boolean; message: string; slug?: string } | null;

const FORBIDDEN = "Bu işlemi yapma yetkiniz yok.";
const GENERIC = "Yazı kaydedilemedi. Lütfen birazdan tekrar deneyin.";

async function asAdmin() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("is_admin");

  return { supabase, ok: data === true };
}

function refresh(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    // An empty upload field is an empty string, which is not the same as "no
    // cover" — normalised here so the column holds null rather than "".
    cover: String(formData.get("cover_image") ?? "").trim() || null,
  };
}

export async function createPost(
  _previous: PostResult,
  formData: FormData
): Promise<PostResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const { title, body, cover } = readFields(formData);

  if (title === "") return { ok: false, message: "Başlık gerekli." };

  // Generated once, here, and never touched again on edit — a published link
  // that breaks because a typo was fixed later is worse than a slug that no
  // longer matches its title. A second post with the same title gets a
  // numbered suffix rather than colliding.
  const base = slugify(title);
  let slug = base;

  for (let attempt = 2; attempt <= 50; attempt += 1) {
    const { data: taken } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!taken) break;
    slug = `${base}-${attempt}`;
  }

  const { error } = await supabase
    .from("posts")
    .insert({ slug, title, body, cover_image: cover });

  if (error) return { ok: false, message: GENERIC };

  refresh(slug);

  return { ok: true, message: "Yazı yayımlandı.", slug };
}

export async function updatePost(
  id: number,
  _previous: PostResult,
  formData: FormData
): Promise<PostResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const { title, body, cover } = readFields(formData);

  if (title === "") return { ok: false, message: "Başlık gerekli." };

  // No slug here on purpose. The URL is a promise once it is out in the world.
  const { data, error } = await supabase
    .from("posts")
    .update({ title, body, cover_image: cover, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, message: GENERIC };

  refresh(data?.slug);

  return { ok: true, message: "Yazı güncellendi." };
}

export async function deletePost(
  id: number,
  _previous: PostResult
): Promise<PostResult> {
  const { supabase, ok } = await asAdmin();
  if (!ok) return { ok: false, message: FORBIDDEN };

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, message: GENERIC };

  refresh(data?.slug);

  return { ok: true, message: "Yazı silindi." };
}
