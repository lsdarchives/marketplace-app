begin;
select plan(18);

-- Fixtures: seller Sam, buyer Bea (profiles come from the signup trigger)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000051', 'sam@test.local'),
  ('00000000-0000-0000-0000-000000000052', 'bea@test.local');

select ok((select count(*) from public.categories) >= 10, 'categories are seeded');

-- Sam creates a draft listing ----------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000051", "role": "authenticated"}';

insert into public.listings (id, title, price_cents, category_slug, condition, brand, region)
values ('00000000-0000-0000-0000-0000000000f1', 'Road bike', 450000, 'sports', 'good', 'Trek', 'Durban');

select is(
  (select seller_id from public.listings where id = '00000000-0000-0000-0000-0000000000f1'),
  '00000000-0000-0000-0000-000000000051'::uuid, 'seller_id defaults to the signed-in user'
);

select throws_ok(
  $$ insert into public.listings (seller_id, title, price_cents, category_slug, condition)
     values ('00000000-0000-0000-0000-000000000052', 'Fake', 100, 'other', 'new') $$,
  '42501', null, 'cannot create a listing for someone else'
);

select throws_ok(
  $$ insert into public.listing_images (listing_id, path, position)
     values ('00000000-0000-0000-0000-0000000000f1',
             '00000000-0000-0000-0000-000000000052/x.jpg', 0) $$,
  '42501', null, 'image paths must be in the seller''s own folder'
);

select lives_ok(
  $$ insert into public.listing_images (listing_id, path, position)
     values ('00000000-0000-0000-0000-0000000000f1',
             '00000000-0000-0000-0000-000000000051/00000000-0000-0000-0000-0000000000f1/0.jpg', 0) $$,
  'seller can attach photos to their own listing'
);

-- Drafts are private ---------------------------------------------------------------------
set local role anon;
select is((select count(*)::int from public.listings), 0, 'drafts are hidden from the public');
select is((select count(*)::int from public.listing_images), 0, 'draft photos are hidden too');

-- Publishing logs a server-side event ----------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000051", "role": "authenticated"}';
update public.listings set status = 'active' where id = '00000000-0000-0000-0000-0000000000f1';

set local role anon;
select is((select count(*)::int from public.listings), 1, 'active listings are public');
select is((select count(*)::int from public.listing_images), 1, 'active listing photos are public');

-- Bea (buyer) can't touch Sam's listing ----------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000052", "role": "authenticated"}';
update public.listings set price_cents = 1 where id = '00000000-0000-0000-0000-0000000000f1';
delete from public.listings where id = '00000000-0000-0000-0000-0000000000f1';
reset role;
select is(
  (select price_cents from public.listings where id = '00000000-0000-0000-0000-0000000000f1'),
  450000, 'another user cannot change or delete the listing'
);

-- Events are write-only and can't be forged -------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000052", "role": "authenticated"}';
select lives_ok(
  $$ insert into public.events (event_type, listing_id)
     values ('listing_viewed', '00000000-0000-0000-0000-0000000000f1') $$,
  'users can log a view'
);
select throws_ok(
  $$ insert into public.events (event_type, listing_id, user_id)
     values ('listing_viewed', '00000000-0000-0000-0000-0000000000f1',
             '00000000-0000-0000-0000-000000000051') $$,
  '42501', null, 'users cannot log events as someone else'
);
select throws_ok(
  $$ insert into public.events (event_type, listing_id)
     values ('listing_sold', '00000000-0000-0000-0000-0000000000f1') $$,
  '42501', null, 'clients cannot fake lifecycle events'
);
select throws_ok(
  $$ select * from public.events $$,
  '42501', null, 'clients cannot read events'
);

set local role anon;
select lives_ok(
  $$ insert into public.events (event_type, listing_id)
     values ('listing_viewed', '00000000-0000-0000-0000-0000000000f1') $$,
  'anonymous visitors can log a view'
);

-- Marking as sold stamps sold_at and logs the final price -------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000051", "role": "authenticated"}';
update public.listings set status = 'sold', sold_price_cents = 420000
  where id = '00000000-0000-0000-0000-0000000000f1';

reset role;
select isnt(
  (select sold_at from public.listings where id = '00000000-0000-0000-0000-0000000000f1'),
  null, 'sold_at is stamped by the server'
);
select is(
  (select array_agg(event_type order by id) from public.events
   where listing_id = '00000000-0000-0000-0000-0000000000f1'),
  array['listing_created', 'listing_viewed', 'listing_viewed', 'listing_sold'],
  'lifecycle and engagement events are recorded in order'
);
select is(
  (select (properties ->> 'sold_price_cents')::int from public.events
   where listing_id = '00000000-0000-0000-0000-0000000000f1' and event_type = 'listing_sold'),
  420000, 'the sale event captures the final price for future pricing models'
);

select * from finish();
rollback;
