-- The shop ships inside Turkey only.
--
-- The checkout form already offers only Turkish provinces, but place_order is a
-- public endpoint: a signed-in member can call it from the browser console with
-- any address. So a new order is refused here unless it names a Turkish
-- province and a Turkish phone number.
--
-- A trigger on insert rather than a check constraint: a constraint would also
-- run on every status change, and an older order with an odd phone number would
-- then refuse to be marked paid.

create table provinces (
  name text primary key
);

-- Nobody reads or writes it through the API. The hosted project grants new
-- tables to anon and authenticated by default, so take that away explicitly.
alter table provinces enable row level security;
revoke all on provinces from anon, authenticated;
grant select on provinces to service_role;

-- Same list as lib/provinces.ts. A test fails if the two drift apart.
insert into provinces (name) values
  ('Adana'), ('Adıyaman'), ('Afyonkarahisar'), ('Ağrı'), ('Amasya'), ('Ankara'),
  ('Antalya'), ('Artvin'), ('Aydın'), ('Balıkesir'), ('Bilecik'), ('Bingöl'),
  ('Bitlis'), ('Bolu'), ('Burdur'), ('Bursa'), ('Çanakkale'), ('Çankırı'),
  ('Çorum'), ('Denizli'), ('Diyarbakır'), ('Edirne'), ('Elazığ'), ('Erzincan'),
  ('Erzurum'), ('Eskişehir'), ('Gaziantep'), ('Giresun'), ('Gümüşhane'),
  ('Hakkari'), ('Hatay'), ('Isparta'), ('Mersin'), ('İstanbul'), ('İzmir'),
  ('Kars'), ('Kastamonu'), ('Kayseri'), ('Kırklareli'), ('Kırşehir'),
  ('Kocaeli'), ('Konya'), ('Kütahya'), ('Malatya'), ('Manisa'),
  ('Kahramanmaraş'), ('Mardin'), ('Muğla'), ('Muş'), ('Nevşehir'), ('Niğde'),
  ('Ordu'), ('Rize'), ('Sakarya'), ('Samsun'), ('Siirt'), ('Sinop'), ('Sivas'),
  ('Tekirdağ'), ('Tokat'), ('Trabzon'), ('Tunceli'), ('Şanlıurfa'), ('Uşak'),
  ('Van'), ('Yozgat'), ('Zonguldak'), ('Aksaray'), ('Bayburt'), ('Karaman'),
  ('Kırıkkale'), ('Batman'), ('Şırnak'), ('Bartın'), ('Ardahan'), ('Iğdır'),
  ('Yalova'), ('Karabük'), ('Kilis'), ('Osmaniye'), ('Düzce');

-- Same rule as isTurkishPhone in lib/provinces.ts: digits only, an optional
-- 0090 / 90 / 0, then ten digits starting 2–5 (landline 2–4, mobile 5).
create function refuse_delivery_outside_turkey()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from provinces where name = new.city)
     or regexp_replace(new.phone, '\D', '', 'g') !~ '^(0090|90|0)?[2-5][0-9]{9}$'
  then
    -- Raised inside place_order's transaction, so the stock it already took
    -- comes back with the rest.
    raise exception 'outside_turkey';
  end if;

  return new;
end;
$$;

create trigger orders_deliver_inside_turkey
before insert on orders
for each row
execute function refuse_delivery_outside_turkey();
