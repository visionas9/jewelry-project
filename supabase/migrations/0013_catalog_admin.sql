-- The administrator may edit the catalog.
--
-- Until now the catalog was read-only to the API and the shop changed it with
-- the service role key — a key that never reaches a browser, which meant the
-- change had to go through a developer. The panel exists so it does not, so the
-- write verbs are granted and is_admin() decides, on the same terms as orders
-- and posts: the account *and* a verified second factor.
--
-- Reading is untouched. The catalog stays public.

grant insert, update, delete on products to authenticated;

create policy "the administrator writes products"
on products
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Deleting was never granted to the service role either; the seed and the tests
-- want it now that a product can be removed.
grant delete on products to service_role;

-- Where product photos live when she adds them herself.
--
-- The bracelets shipped with the site are files in the repository, and they can
-- stay there — an images column holds whatever string it is given, so a local
-- path and a Storage URL both work. Anything she uploads from the panel goes
-- here instead, because she cannot add a file to the repository.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "anybody may see a product image"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

create policy "the administrator writes product images"
on storage.objects
for all
to authenticated
using (bucket_id = 'product-images' and is_admin())
with check (bucket_id = 'product-images' and is_admin());
