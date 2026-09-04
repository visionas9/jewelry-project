-- The fatura for an order.
--
-- The invoice itself is issued in GİB or an integrator, never here: an e-Arşiv
-- Fatura's number and serial come from there, and a number this app invented
-- would not match the shop's official records. So the column below is a pointer
-- to a file she uploads, not a document this system creates.

alter table orders add column invoice_path text;

-- The administrator writes it; the buyer may read it on their own order,
-- because that is how their page knows whether to offer a download at all. The
-- existing select policies already scope reads to the buyer and the admin, so
-- adding the column is enough for reading — what needs saying is who may write.
--
-- Orders have no update policy at all today (they move only through the
-- transition functions), so this is the first one, and it is deliberately
-- narrow: the administrator, with a second factor.
--
-- The grant is narrower still. A table-wide UPDATE would let a signed-in
-- administrator rewrite a status or a total straight through the API, which is
-- exactly what place_order and the transition functions exist to prevent. A
-- column grant says the only thing the API may ever change on an order is where
-- its invoice is filed.
grant update (invoice_path) on orders to authenticated;

create policy "the administrator attaches an invoice"
on orders
for update
to authenticated
using (is_admin())
with check (is_admin());

-- A private bucket, unlike blog and product images. A fatura carries a name, an
-- address and a phone number, so nothing here is served publicly: the panel
-- reads it through the session, and the buyer's page gets a short-lived signed
-- URL generated per request.
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Only the administrator touches the bucket directly. The buyer never does —
-- their download comes from a signed URL the server mints for them, which needs
-- no policy of its own.
create policy "the administrator reads invoices"
on storage.objects
for select
to authenticated
using (bucket_id = 'invoices' and is_admin());

create policy "the administrator writes invoices"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'invoices' and is_admin());

create policy "the administrator replaces invoices"
on storage.objects
for update
to authenticated
using (bucket_id = 'invoices' and is_admin())
with check (bucket_id = 'invoices' and is_admin());

create policy "the administrator removes invoices"
on storage.objects
for delete
to authenticated
using (bucket_id = 'invoices' and is_admin());
