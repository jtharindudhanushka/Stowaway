-- ================================================================
-- STOWAWAY — Fix Auth User Passwords
-- Run this ONCE in Supabase SQL Editor to set real passwords
-- for the two seed staff accounts.
-- ================================================================

-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- Fix admin@stowaway.lk password to: StowawayAdmin2026!
update auth.users
set
  encrypted_password = crypt('StowawayAdmin2026!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'admin@stowaway.lk';

-- Fix staff@stowaway.lk password to: StowawayStaff2026!
update auth.users
set
  encrypted_password = crypt('StowawayStaff2026!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'staff@stowaway.lk';

-- Verify both accounts now exist with proper passwords
select
  id,
  email,
  email_confirmed_at,
  created_at,
  role
from auth.users
where email in ('admin@stowaway.lk', 'staff@stowaway.lk');
