begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000061', 'sid@test.local'),
  ('00000000-0000-0000-0000-000000000062', 'max@test.local');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000061", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.seller_contacts (whatsapp) values ('+27821234567') $$,
  'user can save their own WhatsApp number'
);

select throws_ok(
  $$ insert into public.seller_contacts (user_id, whatsapp)
     values ('00000000-0000-0000-0000-000000000062', '+27820000000') $$,
  '42501', null, 'user cannot set someone else''s contact'
);

select throws_ok(
  $$ update public.seller_contacts set whatsapp = '0821234567' $$,
  '23514', null, 'numbers must be in international format'
);

set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000062", "role": "authenticated"}';
select is(
  (select whatsapp from public.seller_contacts where user_id = '00000000-0000-0000-0000-000000000061'),
  '+27821234567', 'signed-in buyers can see a seller''s contact'
);

set local role anon;
select is((select count(*)::int from public.seller_contacts), 0, 'anonymous visitors cannot');

select * from finish();
rollback;
