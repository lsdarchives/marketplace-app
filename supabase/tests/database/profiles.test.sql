begin;
select plan(8);

select has_table('public', 'profiles', 'profiles table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled on profiles'
);

-- Two test users
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username) values
  ('00000000-0000-0000-0000-00000000000a', 'alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob');

-- Anonymous visitors can read profiles
set local role anon;
select is((select count(*)::int from public.profiles), 2, 'anon can read profiles');

-- Anonymous visitors cannot write
select throws_ok(
  $$ update public.profiles set display_name = 'hacked' $$,
  '42501', null, 'anon cannot update profiles'
);

-- Alice can update herself...
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a"}';
update public.profiles set display_name = 'Alice' where id = '00000000-0000-0000-0000-00000000000a';
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'Alice', 'user can update own profile'
);

-- ...but not Bob (RLS silently filters the row)
update public.profiles set display_name = 'pwned' where id = '00000000-0000-0000-0000-00000000000b';
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  null, 'user cannot update another profile'
);

-- Clients cannot insert profiles directly
select throws_ok(
  $$ insert into public.profiles (id) values ('00000000-0000-0000-0000-00000000000c') $$,
  '42501', null, 'clients cannot insert profiles'
);

-- Server-controlled columns are not client-writable
select throws_ok(
  $$ update public.profiles set created_at = now() - interval '1 year'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'clients cannot change created_at'
);

select * from finish();
rollback;
