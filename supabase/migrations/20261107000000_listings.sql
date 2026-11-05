-- Increment 2: listings (closed beta) + event logging for future AI pricing.

-- Categories (reference data, so it lives in a migration rather than seed.sql) -------

create table public.categories (
  slug       text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name       text not null,
  sort_order smallint not null default 0
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select to anon, authenticated using (true);

insert into public.categories (slug, name, sort_order) values
  ('electronics',        'Electronics',             10),
  ('phones',             'Phones & Tablets',        20),
  ('computers',          'Computers & Gaming',      30),
  ('fashion',            'Fashion',                 40),
  ('home',               'Home & Garden',           50),
  ('furniture',          'Furniture',               60),
  ('vehicles',           'Vehicles & Parts',        70),
  ('sports',             'Sports & Outdoors',       80),
  ('collectibles',       'Collectibles & Art',      90),
  ('toys',               'Toys & Baby',            100),
  ('books-music',        'Books, Music & Movies',  110),
  ('tools',              'Tools & DIY',            120),
  ('health-beauty',      'Health & Beauty',        130),
  ('other',              'Other',                  999);

-- Listings ----------------------------------------------------------------------------

create type public.listing_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
create type public.listing_status as enum ('draft', 'active', 'sold', 'removed');

create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 80),
  description      text not null default '' check (char_length(description) <= 4000),
  -- Money is stored in minor units (cents) to avoid floating-point errors.
  price_cents      integer not null check (price_cents between 0 and 1000000000),
  currency         char(3) not null default 'ZAR',
  category_slug    text not null references public.categories (slug),
  condition        public.listing_condition not null,
  brand            text check (char_length(brand) <= 60),
  region           text check (char_length(region) <= 80),
  status           public.listing_status not null default 'draft',
  sold_price_cents integer check (sold_price_cents >= 0),
  sold_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index listings_feed_idx on public.listings (created_at desc, id desc) where status = 'active';
create index listings_category_feed_idx
  on public.listings (category_slug, created_at desc, id desc) where status = 'active';
create index listings_seller_idx on public.listings (seller_id, created_at desc);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- sold_at is server-controlled: stamped when a listing becomes sold, cleared otherwise.
create or replace function public.listings_track_sold()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at := now();
    new.sold_price_cents := coalesce(new.sold_price_cents, new.price_cents);
  elsif new.status <> 'sold' then
    new.sold_at := null;
    new.sold_price_cents := null;
  end if;
  return new;
end;
$$;

create trigger listings_track_sold
  before update of status on public.listings
  for each row execute function public.listings_track_sold();

alter table public.listings enable row level security;

create policy "Active listings are public; sellers see their own"
  on public.listings for select to anon, authenticated
  using (status in ('active', 'sold') or seller_id = (select auth.uid()));

create policy "Signed-in users create their own listings"
  on public.listings for insert to authenticated
  with check (seller_id = (select auth.uid()));

create policy "Sellers update their own listings"
  on public.listings for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy "Sellers delete their own listings"
  on public.listings for delete to authenticated
  using (seller_id = (select auth.uid()));

-- Clients may not set server-controlled columns.
revoke insert, update on public.listings from anon, authenticated;
grant insert (title, description, price_cents, currency, category_slug, condition, brand, region, status)
  on public.listings to authenticated;
grant update (title, description, price_cents, category_slug, condition, brand, region, status, sold_price_cents)
  on public.listings to authenticated;

-- Listing photos ---------------------------------------------------------------------

create table public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path       text not null,
  position   smallint not null check (position between 0 and 7),
  width      integer,
  height     integer,
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

alter table public.listing_images enable row level security;

create policy "Images follow their listing's visibility"
  on public.listing_images for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));

create policy "Sellers add images to their own listings"
  on public.listing_images for insert to authenticated
  with check (
    exists (select 1 from public.listings l
            where l.id = listing_id and l.seller_id = (select auth.uid()))
    -- the file must live in the seller's own storage folder
    and split_part(path, '/', 1) = (select auth.uid())::text
  );

create policy "Sellers remove images from their own listings"
  on public.listing_images for delete to authenticated
  using (exists (select 1 from public.listings l
                 where l.id = listing_id and l.seller_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Paths: listing-photos/<user id>/<listing id>/<file>
create policy "Listing photos are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'listing-photos');

create policy "Sellers upload listing photos to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Sellers delete their own listing photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Seller contact (until in-app chat in Increment 5) -----------------------------------
-- Kept out of `profiles` so it is never visible to anonymous visitors.

create table public.seller_contacts (
  user_id    uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  whatsapp   text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at timestamptz not null default now()
);

create trigger seller_contacts_set_updated_at
  before update on public.seller_contacts
  for each row execute function public.set_updated_at();

alter table public.seller_contacts enable row level security;

create policy "Signed-in users can see seller contacts"
  on public.seller_contacts for select to authenticated using (true);

create policy "Users manage their own contact"
  on public.seller_contacts for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own contact"
  on public.seller_contacts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke insert, update on public.seller_contacts from anon, authenticated;
-- user_id is updatable only so client upserts work; the policy pins it to the caller.
grant insert (user_id, whatsapp), update (user_id, whatsapp) on public.seller_contacts to authenticated;

-- Events: the data future AI pricing/fraud models learn from ---------------------------
-- Append-only and write-only from clients: nobody can read events through the API.

create table public.events (
  id          bigint generated always as identity primary key,
  event_type  text not null check (event_type in (
                'listing_created', 'listing_viewed', 'listing_contacted',
                'listing_sold', 'listing_removed')),
  user_id     uuid default auth.uid() references auth.users (id) on delete set null,
  listing_id  uuid references public.listings (id) on delete set null,
  properties  jsonb not null default '{}'::jsonb
              check (pg_column_size(properties) <= 2048),
  created_at  timestamptz not null default now()
);

create index events_listing_idx on public.events (listing_id, event_type);
create index events_created_idx on public.events (created_at);

alter table public.events enable row level security;

-- Clients may only log engagement events, and only as themselves (or anonymously).
create policy "Clients log their own engagement events"
  on public.events for insert to anon, authenticated
  with check (
    event_type in ('listing_viewed', 'listing_contacted')
    and user_id is not distinct from (select auth.uid())
  );

revoke all on public.events from anon, authenticated;
grant insert (event_type, user_id, listing_id, properties) on public.events to anon, authenticated;

-- Lifecycle events are recorded server-side so they can't be skipped or faked.
create or replace function public.listings_log_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'active' and old.status = 'draft' then
    insert into public.events (event_type, user_id, listing_id, properties)
    values ('listing_created', new.seller_id, new.id, jsonb_build_object(
      'category', new.category_slug, 'condition', new.condition, 'brand', new.brand,
      'region', new.region, 'price_cents', new.price_cents, 'currency', new.currency));
  elsif tg_op = 'UPDATE' and new.status = 'sold' and old.status is distinct from 'sold' then
    insert into public.events (event_type, user_id, listing_id, properties)
    values ('listing_sold', new.seller_id, new.id, jsonb_build_object(
      'category', new.category_slug, 'condition', new.condition, 'brand', new.brand,
      'region', new.region, 'price_cents', new.price_cents,
      'sold_price_cents', new.sold_price_cents, 'currency', new.currency,
      'days_listed', extract(epoch from (now() - new.created_at)) / 86400));
  elsif tg_op = 'UPDATE' and new.status = 'removed' and old.status is distinct from 'removed' then
    insert into public.events (event_type, user_id, listing_id)
    values ('listing_removed', new.seller_id, new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.listings_log_lifecycle() from public, anon, authenticated;

create trigger listings_log_lifecycle
  after update of status on public.listings
  for each row execute function public.listings_log_lifecycle();
