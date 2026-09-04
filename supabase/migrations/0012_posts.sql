-- The blog.
--
-- The one thing on the site the shop writes and everybody reads. Readable by
-- anyone including a signed-out visitor, writable by the administrator alone —
-- and decided here, so a page that forgets to check cannot let anything
-- through.

create table posts (
  id           bigint generated always as identity primary key,
  -- The readable half of the URL. Generated from the title when the post is
  -- created and never changed afterwards: a published link that breaks because
  -- somebody fixed a typo in the title is worse than a slug that no longer
  -- matches it.
  slug         text not null unique,
  title        text not null check (length(trim(title)) > 0),
  body         text not null default '',
  -- A path in the blog-images bucket, or nothing. Optional because a post with
  -- something to say is worth more than a post with a picture.
  cover_image  text,
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The list page reads them newest first, which is the only way they are ever
-- read in bulk.
create index posts_published_at_idx on posts (published_at desc);

alter table posts enable row level security;

-- Reading is granted to both roles a browser can hold. There is nothing private
-- here — a blog nobody may read is a blog that does not work.
grant select on posts to anon, authenticated;

create policy "anybody may read a post"
on posts
for select
to anon, authenticated
using (true);

-- Writing is the administrator's alone, and is_admin() is the account *and* a
-- verified second factor: a stolen password publishes nothing.
grant insert, update, delete on posts to authenticated;

create policy "the administrator writes posts"
on posts
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Where a cover image lives.
--
-- Product photos are files in the repository, but she cannot add a file to the
-- repository — that is the whole reason the blog is written from the panel
-- rather than from a commit. So the images go to Storage instead.
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Public read, because the bucket serves the pictures on a public page.
create policy "anybody may see a blog image"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'blog-images');

-- Uploading and removing is the administrator's, on the same terms as the posts
-- themselves.
create policy "the administrator writes blog images"
on storage.objects
for all
to authenticated
using (bucket_id = 'blog-images' and is_admin())
with check (bucket_id = 'blog-images' and is_admin());

-- The service role bypasses RLS but still needs the table privilege, exactly as
-- it does for the catalog — see 0006. Seeds and tests write through it.
grant select, insert, update, delete on posts to service_role;
