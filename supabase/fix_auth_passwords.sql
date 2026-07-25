-- ================================================================
-- STOWAWAY — Complete Auth Fix
-- The 500 error is caused by MISSING auth.identities records.
-- Supabase requires a companion row in auth.identities for every
-- email/password user — the seed only inserted into auth.users.
-- Run this in Supabase SQL Editor.
-- ================================================================

create extension if not exists pgcrypto;

-- Step 1: Fix passwords with real bcrypt hashes
update auth.users
set
  encrypted_password = crypt('StowawayAdmin2026!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'admin@stowaway.lk';

update auth.users
set
  encrypted_password = crypt('StowawayStaff2026!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'staff@stowaway.lk';

-- Step 2: Insert missing auth.identities records (THIS is why you get 500)
-- Supabase's signInWithPassword requires a matching identity record.
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
from auth.users u
where u.email in ('admin@stowaway.lk', 'staff@stowaway.lk')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- Step 3: Verify
select
  u.email,
  u.email_confirmed_at is not null as email_confirmed,
  count(i.id) as identity_count
from auth.users u
left join auth.identities i on i.user_id = u.id
where u.email in ('admin@stowaway.lk', 'staff@stowaway.lk')
group by u.email, u.email_confirmed_at;
