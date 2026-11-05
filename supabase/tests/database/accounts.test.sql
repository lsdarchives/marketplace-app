begin;
select plan(6);

-- Signup creates a profile automatically
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'carol@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', 'dave@test.local');

select is(
  (select count(*)::int from public.profiles
   where id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2')),
  2, 'a profile row is created for each new auth user'
);

select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'clients cannot call handle_new_user directly'
);

select is(
  (select public from storage.buckets where id = 'avatars'),
  true, 'avatars bucket exists and is publicly readable'
);

-- Carol uploads into her own folder
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '00000000-0000-0000-0000-0000000000a1/avatar.jpg') $$,
  'user can upload into their own avatar folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '00000000-0000-0000-0000-0000000000b2/avatar.jpg') $$,
  '42501', null, 'user cannot upload into another user''s folder'
);

-- Anonymous visitors cannot upload at all
set local role anon;
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('avatars', '00000000-0000-0000-0000-0000000000a1/x.jpg') $$,
  '42501', null, 'anonymous visitors cannot upload'
);

select * from finish();
rollback;
