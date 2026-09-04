import { SUPABASE_URL } from "./supabase-env";

// The blog's reading side. Writing lives in the panel's own actions.
//
// Posts are readable by anyone, so these run through whichever client the
// caller has — there is no policy here that depends on who is asking.

export type Post = {
  id: number;
  slug: string;
  title: string;
  body: string;
  coverImage: string | null;
  publishedAt: string;
};

// What a cover image's path in the bucket becomes on a page. The bucket is
// public, so this is a plain URL with nothing to sign.
export function coverImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/blog-images/${path}`;
}

type Row = {
  id: number;
  slug: string;
  title: string;
  body: string;
  cover_image: string | null;
  published_at: string;
};

export function toPost(row: Row): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    coverImage: row.cover_image,
    publishedAt: row.published_at,
  };
}

export const POST_COLUMNS = "id, slug, title, body, cover_image, published_at";

// A post body is written as plain text, so paragraphs are blank-line separated
// and nothing is parsed as markup. React escapes whatever is rendered, which is
// what keeps a post body from being a place to run script.
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}
